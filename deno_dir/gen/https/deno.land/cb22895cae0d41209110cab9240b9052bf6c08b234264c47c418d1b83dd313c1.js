import { ERR_INVALID_ARG_TYPE, ERR_INVALID_ARG_VALUE, ERR_INVALID_FILE_URL_HOST, ERR_INVALID_FILE_URL_PATH, ERR_INVALID_URL_SCHEME, } from "./_errors.ts";
import { CHAR_0, CHAR_9, CHAR_AT, CHAR_BACKWARD_SLASH, CHAR_CARRIAGE_RETURN, CHAR_CIRCUMFLEX_ACCENT, CHAR_DOT, CHAR_DOUBLE_QUOTE, CHAR_FORM_FEED, CHAR_FORWARD_SLASH, CHAR_GRAVE_ACCENT, CHAR_HASH, CHAR_HYPHEN_MINUS, CHAR_LEFT_ANGLE_BRACKET, CHAR_LEFT_CURLY_BRACKET, CHAR_LEFT_SQUARE_BRACKET, CHAR_LINE_FEED, CHAR_LOWERCASE_A, CHAR_LOWERCASE_Z, CHAR_NO_BREAK_SPACE, CHAR_PERCENT, CHAR_PLUS, CHAR_QUESTION_MARK, CHAR_RIGHT_ANGLE_BRACKET, CHAR_RIGHT_CURLY_BRACKET, CHAR_RIGHT_SQUARE_BRACKET, CHAR_SEMICOLON, CHAR_SINGLE_QUOTE, CHAR_SPACE, CHAR_TAB, CHAR_UNDERSCORE, CHAR_UPPERCASE_A, CHAR_UPPERCASE_Z, CHAR_VERTICAL_LINE, CHAR_ZERO_WIDTH_NOBREAK_SPACE, } from "../path/_constants.ts";
import * as path from "./path.ts";
import { toASCII } from "./internal/idna.ts";
import { isWindows, osType } from "../_util/os.ts";
import { encodeStr, hexTable } from "./internal/querystring.ts";
const forwardSlashRegEx = /\//g;
const percentRegEx = /%/g;
const backslashRegEx = /\\/g;
const newlineRegEx = /\n/g;
const carriageReturnRegEx = /\r/g;
const tabRegEx = /\t/g;
const protocolPattern = /^[a-z0-9.+-]+:/i;
const portPattern = /:[0-9]*$/;
const hostPattern = /^\/\/[^@/]+@[^@/]+/;
const simplePathPattern = /^(\/\/?(?!\/)[^?\s]*)(\?[^\s]*)?$/;
const unsafeProtocol = new Set(["javascript", "javascript:"]);
const hostlessProtocol = new Set(["javascript", "javascript:"]);
const slashedProtocol = new Set([
    "http",
    "http:",
    "https",
    "https:",
    "ftp",
    "ftp:",
    "gopher",
    "gopher:",
    "file",
    "file:",
    "ws",
    "ws:",
    "wss",
    "wss:",
]);
const hostnameMaxLen = 255;
const noEscapeAuth = new Int8Array([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0,
    0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1,
    0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0,
]);
let querystring = null;
const _url = URL;
export { _url as URL };
export class Url {
    protocol;
    slashes;
    auth;
    host;
    port;
    hostname;
    hash;
    search;
    query;
    pathname;
    path;
    href;
    constructor() {
        this.protocol = null;
        this.slashes = null;
        this.auth = null;
        this.host = null;
        this.port = null;
        this.hostname = null;
        this.hash = null;
        this.search = null;
        this.query = null;
        this.pathname = null;
        this.path = null;
        this.href = null;
    }
    parseHost() {
        let host = this.host || "";
        let port = portPattern.exec(host);
        if (port) {
            port = port[0];
            if (port !== ":") {
                this.port = port.slice(1);
            }
            host = host.slice(0, host.length - port.length);
        }
        if (host)
            this.hostname = host;
    }
    resolveObject(relative) {
        if (typeof relative === "string") {
            const rel = new Url();
            rel.urlParse(relative, false, true);
            relative = rel;
        }
        const result = new Url();
        const tkeys = Object.keys(this);
        for (let tk = 0; tk < tkeys.length; tk++) {
            const tkey = tkeys[tk];
            result[tkey] = this[tkey];
        }
        result.hash = relative.hash;
        if (relative.href === "") {
            result.href = result.format();
            return result;
        }
        if (relative.slashes && !relative.protocol) {
            const rkeys = Object.keys(relative);
            for (let rk = 0; rk < rkeys.length; rk++) {
                const rkey = rkeys[rk];
                if (rkey !== "protocol")
                    result[rkey] = relative[rkey];
            }
            if (result.protocol && slashedProtocol.has(result.protocol) &&
                result.hostname &&
                !result.pathname) {
                result.path = result.pathname = "/";
            }
            result.href = result.format();
            return result;
        }
        if (relative.protocol && relative.protocol !== result.protocol) {
            if (!slashedProtocol.has(relative.protocol)) {
                const keys = Object.keys(relative);
                for (let v = 0; v < keys.length; v++) {
                    const k = keys[v];
                    result[k] = relative[k];
                }
                result.href = result.format();
                return result;
            }
            result.protocol = relative.protocol;
            if (!relative.host &&
                !/^file:?$/.test(relative.protocol) &&
                !hostlessProtocol.has(relative.protocol)) {
                const relPath = (relative.pathname || "").split("/");
                while (relPath.length && !(relative.host = relPath.shift() || null))
                    ;
                if (!relative.host)
                    relative.host = "";
                if (!relative.hostname)
                    relative.hostname = "";
                if (relPath[0] !== "")
                    relPath.unshift("");
                if (relPath.length < 2)
                    relPath.unshift("");
                result.pathname = relPath.join("/");
            }
            else {
                result.pathname = relative.pathname;
            }
            result.search = relative.search;
            result.query = relative.query;
            result.host = relative.host || "";
            result.auth = relative.auth;
            result.hostname = relative.hostname || relative.host;
            result.port = relative.port;
            if (result.pathname || result.search) {
                const p = result.pathname || "";
                const s = result.search || "";
                result.path = p + s;
            }
            result.slashes = result.slashes || relative.slashes;
            result.href = result.format();
            return result;
        }
        const isSourceAbs = result.pathname && result.pathname.charAt(0) === "/";
        const isRelAbs = relative.host ||
            (relative.pathname && relative.pathname.charAt(0) === "/");
        let mustEndAbs = isRelAbs ||
            isSourceAbs || (result.host && relative.pathname);
        const removeAllDots = mustEndAbs;
        let srcPath = (result.pathname && result.pathname.split("/")) || [];
        const relPath = (relative.pathname && relative.pathname.split("/")) || [];
        const noLeadingSlashes = result.protocol &&
            !slashedProtocol.has(result.protocol);
        if (noLeadingSlashes) {
            result.hostname = "";
            result.port = null;
            if (result.host) {
                if (srcPath[0] === "")
                    srcPath[0] = result.host;
                else
                    srcPath.unshift(result.host);
            }
            result.host = "";
            if (relative.protocol) {
                relative.hostname = null;
                relative.port = null;
                result.auth = null;
                if (relative.host) {
                    if (relPath[0] === "")
                        relPath[0] = relative.host;
                    else
                        relPath.unshift(relative.host);
                }
                relative.host = null;
            }
            mustEndAbs = mustEndAbs &&
                (relPath[0] === "" || srcPath[0] === "");
        }
        if (isRelAbs) {
            if (relative.host || relative.host === "") {
                if (result.host !== relative.host)
                    result.auth = null;
                result.host = relative.host;
                result.port = relative.port;
            }
            if (relative.hostname || relative.hostname === "") {
                if (result.hostname !== relative.hostname)
                    result.auth = null;
                result.hostname = relative.hostname;
            }
            result.search = relative.search;
            result.query = relative.query;
            srcPath = relPath;
        }
        else if (relPath.length) {
            if (!srcPath)
                srcPath = [];
            srcPath.pop();
            srcPath = srcPath.concat(relPath);
            result.search = relative.search;
            result.query = relative.query;
        }
        else if (relative.search !== null && relative.search !== undefined) {
            if (noLeadingSlashes) {
                result.hostname = result.host = srcPath.shift() || null;
                const authInHost = result.host &&
                    result.host.indexOf("@") > 0 &&
                    result.host.split("@");
                if (authInHost) {
                    result.auth = authInHost.shift() || null;
                    result.host = result.hostname = authInHost.shift() || null;
                }
            }
            result.search = relative.search;
            result.query = relative.query;
            if (result.pathname !== null || result.search !== null) {
                result.path = (result.pathname ? result.pathname : "") +
                    (result.search ? result.search : "");
            }
            result.href = result.format();
            return result;
        }
        if (!srcPath.length) {
            result.pathname = null;
            if (result.search) {
                result.path = "/" + result.search;
            }
            else {
                result.path = null;
            }
            result.href = result.format();
            return result;
        }
        let last = srcPath.slice(-1)[0];
        const hasTrailingSlash = ((result.host || relative.host || srcPath.length > 1) &&
            (last === "." || last === "..")) ||
            last === "";
        let up = 0;
        for (let i = srcPath.length - 1; i >= 0; i--) {
            last = srcPath[i];
            if (last === ".") {
                srcPath.slice(i);
            }
            else if (last === "..") {
                srcPath.slice(i);
                up++;
            }
            else if (up) {
                srcPath.splice(i);
                up--;
            }
        }
        if (!mustEndAbs && !removeAllDots) {
            while (up--) {
                srcPath.unshift("..");
            }
        }
        if (mustEndAbs &&
            srcPath[0] !== "" &&
            (!srcPath[0] || srcPath[0].charAt(0) !== "/")) {
            srcPath.unshift("");
        }
        if (hasTrailingSlash && srcPath.join("/").substr(-1) !== "/") {
            srcPath.push("");
        }
        const isAbsolute = srcPath[0] === "" ||
            (srcPath[0] && srcPath[0].charAt(0) === "/");
        if (noLeadingSlashes) {
            result.hostname = result.host = isAbsolute
                ? ""
                : srcPath.length
                    ? srcPath.shift() || null
                    : "";
            const authInHost = result.host && result.host.indexOf("@") > 0
                ? result.host.split("@")
                : false;
            if (authInHost) {
                result.auth = authInHost.shift() || null;
                result.host = result.hostname = authInHost.shift() || null;
            }
        }
        mustEndAbs = mustEndAbs || (result.host && srcPath.length);
        if (mustEndAbs && !isAbsolute) {
            srcPath.unshift("");
        }
        if (!srcPath.length) {
            result.pathname = null;
            result.path = null;
        }
        else {
            result.pathname = srcPath.join("/");
        }
        if (result.pathname !== null || result.search !== null) {
            result.path = (result.pathname ? result.pathname : "") +
                (result.search ? result.search : "");
        }
        result.auth = relative.auth || result.auth;
        result.slashes = result.slashes || relative.slashes;
        result.href = result.format();
        return result;
    }
    format() {
        let auth = this.auth || "";
        if (auth) {
            auth = encodeStr(auth, noEscapeAuth, hexTable);
            auth += "@";
        }
        let protocol = this.protocol || "";
        let pathname = this.pathname || "";
        let hash = this.hash || "";
        let host = "";
        let query = "";
        if (this.host) {
            host = auth + this.host;
        }
        else if (this.hostname) {
            host = auth +
                (this.hostname.includes(":") && !isIpv6Hostname(this.hostname)
                    ? "[" + this.hostname + "]"
                    : this.hostname);
            if (this.port) {
                host += ":" + this.port;
            }
        }
        if (this.query !== null && typeof this.query === "object") {
            if (querystring === undefined) {
                querystring = import("./querystring.ts");
            }
            query = querystring.stringify(this.query);
        }
        let search = this.search || (query && "?" + query) || "";
        if (protocol &&
            protocol.charCodeAt(protocol.length - 1) !== 58) {
            protocol += ":";
        }
        let newPathname = "";
        let lastPos = 0;
        for (let i = 0; i < pathname.length; ++i) {
            switch (pathname.charCodeAt(i)) {
                case CHAR_HASH:
                    if (i - lastPos > 0) {
                        newPathname += pathname.slice(lastPos, i);
                    }
                    newPathname += "%23";
                    lastPos = i + 1;
                    break;
                case CHAR_QUESTION_MARK:
                    if (i - lastPos > 0) {
                        newPathname += pathname.slice(lastPos, i);
                    }
                    newPathname += "%3F";
                    lastPos = i + 1;
                    break;
            }
        }
        if (lastPos > 0) {
            if (lastPos !== pathname.length) {
                pathname = newPathname + pathname.slice(lastPos);
            }
            else
                pathname = newPathname;
        }
        if (this.slashes || slashedProtocol.has(protocol)) {
            if (this.slashes || host) {
                if (pathname && pathname.charCodeAt(0) !== CHAR_FORWARD_SLASH) {
                    pathname = "/" + pathname;
                }
                host = "//" + host;
            }
            else if (protocol.length >= 4 &&
                protocol.charCodeAt(0) === 102 &&
                protocol.charCodeAt(1) === 105 &&
                protocol.charCodeAt(2) === 108 &&
                protocol.charCodeAt(3) === 101) {
                host = "//";
            }
        }
        search = search.replace(/#/g, "%23");
        if (hash && hash.charCodeAt(0) !== CHAR_HASH) {
            hash = "#" + hash;
        }
        if (search && search.charCodeAt(0) !== CHAR_QUESTION_MARK) {
            search = "?" + search;
        }
        return protocol + host + pathname + search + hash;
    }
    urlParse(url, parseQueryString, slashesDenoteHost) {
        let hasHash = false;
        let start = -1;
        let end = -1;
        let rest = "";
        let lastPos = 0;
        for (let i = 0, inWs = false, split = false; i < url.length; ++i) {
            const code = url.charCodeAt(i);
            const isWs = code === CHAR_SPACE ||
                code === CHAR_TAB ||
                code === CHAR_CARRIAGE_RETURN ||
                code === CHAR_LINE_FEED ||
                code === CHAR_FORM_FEED ||
                code === CHAR_NO_BREAK_SPACE ||
                code === CHAR_ZERO_WIDTH_NOBREAK_SPACE;
            if (start === -1) {
                if (isWs)
                    continue;
                lastPos = start = i;
            }
            else if (inWs) {
                if (!isWs) {
                    end = -1;
                    inWs = false;
                }
            }
            else if (isWs) {
                end = i;
                inWs = true;
            }
            if (!split) {
                switch (code) {
                    case CHAR_HASH:
                        hasHash = true;
                    case CHAR_QUESTION_MARK:
                        split = true;
                        break;
                    case CHAR_BACKWARD_SLASH:
                        if (i - lastPos > 0)
                            rest += url.slice(lastPos, i);
                        rest += "/";
                        lastPos = i + 1;
                        break;
                }
            }
            else if (!hasHash && code === CHAR_HASH) {
                hasHash = true;
            }
        }
        if (start !== -1) {
            if (lastPos === start) {
                if (end === -1) {
                    if (start === 0)
                        rest = url;
                    else
                        rest = url.slice(start);
                }
                else {
                    rest = url.slice(start, end);
                }
            }
            else if (end === -1 && lastPos < url.length) {
                rest += url.slice(lastPos);
            }
            else if (end !== -1 && lastPos < end) {
                rest += url.slice(lastPos, end);
            }
        }
        if (!slashesDenoteHost && !hasHash) {
            const simplePath = simplePathPattern.exec(rest);
            if (simplePath) {
                this.path = rest;
                this.href = rest;
                this.pathname = simplePath[1];
                if (simplePath[2]) {
                    this.search = simplePath[2];
                    if (parseQueryString) {
                        if (querystring === undefined) {
                            querystring = import("./querystring.ts");
                        }
                        this.query = querystring.parse(this.search.slice(1));
                    }
                    else {
                        this.query = this.search.slice(1);
                    }
                }
                else if (parseQueryString) {
                    this.search = null;
                    this.query = Object.create(null);
                }
                return this;
            }
        }
        let proto = protocolPattern.exec(rest);
        let lowerProto = "";
        if (proto) {
            proto = proto[0];
            lowerProto = proto.toLowerCase();
            this.protocol = lowerProto;
            rest = rest.slice(proto.length);
        }
        let slashes;
        if (slashesDenoteHost || proto || hostPattern.test(rest)) {
            slashes = rest.charCodeAt(0) === CHAR_FORWARD_SLASH &&
                rest.charCodeAt(1) === CHAR_FORWARD_SLASH;
            if (slashes && !(proto && hostlessProtocol.has(lowerProto))) {
                rest = rest.slice(2);
                this.slashes = true;
            }
        }
        if (!hostlessProtocol.has(lowerProto) &&
            (slashes || (proto && !slashedProtocol.has(proto)))) {
            let hostEnd = -1;
            let atSign = -1;
            let nonHost = -1;
            for (let i = 0; i < rest.length; ++i) {
                switch (rest.charCodeAt(i)) {
                    case CHAR_TAB:
                    case CHAR_LINE_FEED:
                    case CHAR_CARRIAGE_RETURN:
                    case CHAR_SPACE:
                    case CHAR_DOUBLE_QUOTE:
                    case CHAR_PERCENT:
                    case CHAR_SINGLE_QUOTE:
                    case CHAR_SEMICOLON:
                    case CHAR_LEFT_ANGLE_BRACKET:
                    case CHAR_RIGHT_ANGLE_BRACKET:
                    case CHAR_BACKWARD_SLASH:
                    case CHAR_CIRCUMFLEX_ACCENT:
                    case CHAR_GRAVE_ACCENT:
                    case CHAR_LEFT_CURLY_BRACKET:
                    case CHAR_VERTICAL_LINE:
                    case CHAR_RIGHT_CURLY_BRACKET:
                        if (nonHost === -1)
                            nonHost = i;
                        break;
                    case CHAR_HASH:
                    case CHAR_FORWARD_SLASH:
                    case CHAR_QUESTION_MARK:
                        if (nonHost === -1)
                            nonHost = i;
                        hostEnd = i;
                        break;
                    case CHAR_AT:
                        atSign = i;
                        nonHost = -1;
                        break;
                }
                if (hostEnd !== -1)
                    break;
            }
            start = 0;
            if (atSign !== -1) {
                this.auth = decodeURIComponent(rest.slice(0, atSign));
                start = atSign + 1;
            }
            if (nonHost === -1) {
                this.host = rest.slice(start);
                rest = "";
            }
            else {
                this.host = rest.slice(start, nonHost);
                rest = rest.slice(nonHost);
            }
            this.parseHost();
            if (typeof this.hostname !== "string")
                this.hostname = "";
            const hostname = this.hostname;
            const ipv6Hostname = isIpv6Hostname(hostname);
            if (!ipv6Hostname) {
                rest = getHostname(this, rest, hostname);
            }
            if (this.hostname.length > hostnameMaxLen) {
                this.hostname = "";
            }
            else {
                this.hostname = this.hostname.toLowerCase();
            }
            if (!ipv6Hostname) {
                this.hostname = toASCII(this.hostname);
            }
            const p = this.port ? ":" + this.port : "";
            const h = this.hostname || "";
            this.host = h + p;
            if (ipv6Hostname) {
                this.hostname = this.hostname.slice(1, -1);
                if (rest[0] !== "/") {
                    rest = "/" + rest;
                }
            }
        }
        if (!unsafeProtocol.has(lowerProto)) {
            rest = autoEscapeStr(rest);
        }
        let questionIdx = -1;
        let hashIdx = -1;
        for (let i = 0; i < rest.length; ++i) {
            const code = rest.charCodeAt(i);
            if (code === CHAR_HASH) {
                this.hash = rest.slice(i);
                hashIdx = i;
                break;
            }
            else if (code === CHAR_QUESTION_MARK && questionIdx === -1) {
                questionIdx = i;
            }
        }
        if (questionIdx !== -1) {
            if (hashIdx === -1) {
                this.search = rest.slice(questionIdx);
                this.query = rest.slice(questionIdx + 1);
            }
            else {
                this.search = rest.slice(questionIdx, hashIdx);
                this.query = rest.slice(questionIdx + 1, hashIdx);
            }
            if (parseQueryString) {
                if (querystring === undefined) {
                    querystring = import("./querystring.ts");
                }
                this.query = querystring.parse(this.query);
            }
        }
        else if (parseQueryString) {
            this.search = null;
            this.query = Object.create(null);
        }
        const useQuestionIdx = questionIdx !== -1 &&
            (hashIdx === -1 || questionIdx < hashIdx);
        const firstIdx = useQuestionIdx ? questionIdx : hashIdx;
        if (firstIdx === -1) {
            if (rest.length > 0)
                this.pathname = rest;
        }
        else if (firstIdx > 0) {
            this.pathname = rest.slice(0, firstIdx);
        }
        if (slashedProtocol.has(lowerProto) &&
            this.hostname &&
            !this.pathname) {
            this.pathname = "/";
        }
        if (this.pathname || this.search) {
            const p = this.pathname || "";
            const s = this.search || "";
            this.path = p + s;
        }
        this.href = this.format();
        return this;
    }
}
export function format(urlObject, options) {
    if (options) {
        if (typeof options !== "object") {
            throw new ERR_INVALID_ARG_TYPE("options", "object", options);
        }
    }
    options = {
        auth: true,
        fragment: true,
        search: true,
        unicode: false,
        ...options,
    };
    let ret = urlObject.protocol;
    if (urlObject.host !== null) {
        ret += "//";
        const hasUsername = !!urlObject.username;
        const hasPassword = !!urlObject.password;
        if (options.auth && (hasUsername || hasPassword)) {
            if (hasUsername) {
                ret += urlObject.username;
            }
            if (hasPassword) {
                ret += `:${urlObject.password}`;
            }
            ret += "@";
        }
        ret += urlObject.host;
        if (urlObject.port) {
            ret += `:${urlObject.port}`;
        }
    }
    ret += urlObject.pathname;
    if (options.search && urlObject.search) {
        ret += urlObject.search;
    }
    if (options.fragment && urlObject.hash) {
        ret += urlObject.hash;
    }
    return ret;
}
function isIpv6Hostname(hostname) {
    return (hostname.charCodeAt(0) === CHAR_LEFT_SQUARE_BRACKET &&
        hostname.charCodeAt(hostname.length - 1) === CHAR_RIGHT_SQUARE_BRACKET);
}
function getHostname(self, rest, hostname) {
    for (let i = 0; i < hostname.length; ++i) {
        const code = hostname.charCodeAt(i);
        const isValid = (code >= CHAR_LOWERCASE_A && code <= CHAR_LOWERCASE_Z) ||
            code === CHAR_DOT ||
            (code >= CHAR_UPPERCASE_A && code <= CHAR_UPPERCASE_Z) ||
            (code >= CHAR_0 && code <= CHAR_9) ||
            code === CHAR_HYPHEN_MINUS ||
            code === CHAR_PLUS ||
            code === CHAR_UNDERSCORE ||
            code > 127;
        if (!isValid) {
            self.hostname = hostname.slice(0, i);
            return `/${hostname.slice(i)}${rest}`;
        }
    }
    return rest;
}
const escapedCodes = [
    '', '', '', '', '', '', '', '', '', '%09',
    '%0A', '', '', '%0D', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '', '', '',
    '', '', '%20', '', '%22', '', '', '', '', '%27',
    '', '', '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '', '', '',
    '%3C', '', '%3E', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '', '', '',
    '', '', '%5C', '', '%5E', '', '%60', '', '', '',
    '', '', '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '', '', '',
    '', '', '', '%7B', '%7C', '%7D',
];
function autoEscapeStr(rest) {
    let escaped = "";
    let lastEscapedPos = 0;
    for (let i = 0; i < rest.length; ++i) {
        const escapedChar = escapedCodes[rest.charCodeAt(i)];
        if (escapedChar) {
            if (i > lastEscapedPos) {
                escaped += rest.slice(lastEscapedPos, i);
            }
            escaped += escapedChar;
            lastEscapedPos = i + 1;
        }
    }
    if (lastEscapedPos === 0) {
        return rest;
    }
    if (lastEscapedPos < rest.length) {
        escaped += rest.slice(lastEscapedPos);
    }
    return escaped;
}
export function parse(url, parseQueryString, slashesDenoteHost) {
    if (url instanceof Url)
        return url;
    const urlObject = new Url();
    urlObject.urlParse(url, parseQueryString, slashesDenoteHost);
    return urlObject;
}
export function resolveObject(source, relative) {
    if (!source)
        return relative;
    return parse(source, false, true).resolveObject(relative);
}
export function fileURLToPath(path) {
    if (typeof path === "string")
        path = new URL(path);
    else if (!(path instanceof URL)) {
        throw new ERR_INVALID_ARG_TYPE("path", ["string", "URL"], path);
    }
    if (path.protocol !== "file:") {
        throw new ERR_INVALID_URL_SCHEME("file");
    }
    return isWindows ? getPathFromURLWin(path) : getPathFromURLPosix(path);
}
function getPathFromURLWin(url) {
    const hostname = url.hostname;
    let pathname = url.pathname;
    for (let n = 0; n < pathname.length; n++) {
        if (pathname[n] === "%") {
            const third = pathname.codePointAt(n + 2) | 0x20;
            if ((pathname[n + 1] === "2" && third === 102) ||
                (pathname[n + 1] === "5" && third === 99)) {
                throw new ERR_INVALID_FILE_URL_PATH("must not include encoded \\ or / characters");
            }
        }
    }
    pathname = pathname.replace(forwardSlashRegEx, "\\");
    pathname = decodeURIComponent(pathname);
    if (hostname !== "") {
        return `\\\\${hostname}${pathname}`;
    }
    else {
        const letter = pathname.codePointAt(1) | 0x20;
        const sep = pathname[2];
        if (letter < CHAR_LOWERCASE_A ||
            letter > CHAR_LOWERCASE_Z ||
            sep !== ":") {
            throw new ERR_INVALID_FILE_URL_PATH("must be absolute");
        }
        return pathname.slice(1);
    }
}
function getPathFromURLPosix(url) {
    if (url.hostname !== "") {
        throw new ERR_INVALID_FILE_URL_HOST(osType);
    }
    const pathname = url.pathname;
    for (let n = 0; n < pathname.length; n++) {
        if (pathname[n] === "%") {
            const third = pathname.codePointAt(n + 2) | 0x20;
            if (pathname[n + 1] === "2" && third === 102) {
                throw new ERR_INVALID_FILE_URL_PATH("must not include encoded / characters");
            }
        }
    }
    return decodeURIComponent(pathname);
}
function encodePathChars(filepath) {
    if (filepath.includes("%")) {
        filepath = filepath.replace(percentRegEx, "%25");
    }
    if (!isWindows && filepath.includes("\\")) {
        filepath = filepath.replace(backslashRegEx, "%5C");
    }
    if (filepath.includes("\n")) {
        filepath = filepath.replace(newlineRegEx, "%0A");
    }
    if (filepath.includes("\r")) {
        filepath = filepath.replace(carriageReturnRegEx, "%0D");
    }
    if (filepath.includes("\t")) {
        filepath = filepath.replace(tabRegEx, "%09");
    }
    return filepath;
}
export function pathToFileURL(filepath) {
    const outURL = new URL("file://");
    if (isWindows && filepath.startsWith("\\\\")) {
        const paths = filepath.split("\\");
        if (paths.length <= 3) {
            throw new ERR_INVALID_ARG_VALUE("filepath", filepath, "Missing UNC resource path");
        }
        const hostname = paths[2];
        if (hostname.length === 0) {
            throw new ERR_INVALID_ARG_VALUE("filepath", filepath, "Empty UNC servername");
        }
        outURL.hostname = hostname;
        outURL.pathname = encodePathChars(paths.slice(3).join("/"));
    }
    else {
        let resolved = path.resolve(filepath);
        const filePathLast = filepath.charCodeAt(filepath.length - 1);
        if ((filePathLast === CHAR_FORWARD_SLASH ||
            (isWindows && filePathLast === CHAR_BACKWARD_SLASH)) &&
            resolved[resolved.length - 1] !== path.sep) {
            resolved += "/";
        }
        outURL.pathname = encodePathChars(resolved);
    }
    return outURL;
}
function urlToHttpOptions(url) {
    const options = {
        protocol: url.protocol,
        hostname: typeof url.hostname === "string" && url.hostname.startsWith("[")
            ? url.hostname.slice(1, -1)
            : url.hostname,
        hash: url.hash,
        search: url.search,
        pathname: url.pathname,
        path: `${url.pathname || ""}${url.search || ""}`,
        href: url.href,
    };
    if (url.port !== "") {
        options.port = Number(url.port);
    }
    if (url.username || url.password) {
        options.auth = `${decodeURIComponent(url.username)}:${decodeURIComponent(url.password)}`;
    }
    return options;
}
export default {
    parse,
    format,
    resolveObject,
    fileURLToPath,
    pathToFileURL,
    urlToHttpOptions,
    Url,
    URL,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXJsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidXJsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQXFCQSxPQUFPLEVBQ0wsb0JBQW9CLEVBQ3BCLHFCQUFxQixFQUNyQix5QkFBeUIsRUFDekIseUJBQXlCLEVBQ3pCLHNCQUFzQixHQUN2QixNQUFNLGNBQWMsQ0FBQztBQUN0QixPQUFPLEVBQ0wsTUFBTSxFQUNOLE1BQU0sRUFDTixPQUFPLEVBQ1AsbUJBQW1CLEVBQ25CLG9CQUFvQixFQUNwQixzQkFBc0IsRUFDdEIsUUFBUSxFQUNSLGlCQUFpQixFQUNqQixjQUFjLEVBQ2Qsa0JBQWtCLEVBQ2xCLGlCQUFpQixFQUNqQixTQUFTLEVBQ1QsaUJBQWlCLEVBQ2pCLHVCQUF1QixFQUN2Qix1QkFBdUIsRUFDdkIsd0JBQXdCLEVBQ3hCLGNBQWMsRUFDZCxnQkFBZ0IsRUFDaEIsZ0JBQWdCLEVBQ2hCLG1CQUFtQixFQUNuQixZQUFZLEVBQ1osU0FBUyxFQUNULGtCQUFrQixFQUNsQix3QkFBd0IsRUFDeEIsd0JBQXdCLEVBQ3hCLHlCQUF5QixFQUN6QixjQUFjLEVBQ2QsaUJBQWlCLEVBQ2pCLFVBQVUsRUFDVixRQUFRLEVBQ1IsZUFBZSxFQUNmLGdCQUFnQixFQUNoQixnQkFBZ0IsRUFDaEIsa0JBQWtCLEVBQ2xCLDZCQUE2QixHQUM5QixNQUFNLHVCQUF1QixDQUFDO0FBQy9CLE9BQU8sS0FBSyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQ2xDLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUM3QyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQ25ELE9BQU8sRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFFaEUsTUFBTSxpQkFBaUIsR0FBRyxLQUFLLENBQUM7QUFDaEMsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBQzFCLE1BQU0sY0FBYyxHQUFHLEtBQUssQ0FBQztBQUM3QixNQUFNLFlBQVksR0FBRyxLQUFLLENBQUM7QUFDM0IsTUFBTSxtQkFBbUIsR0FBRyxLQUFLLENBQUM7QUFDbEMsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDO0FBS3ZCLE1BQU0sZUFBZSxHQUFHLGlCQUFpQixDQUFDO0FBQzFDLE1BQU0sV0FBVyxHQUFHLFVBQVUsQ0FBQztBQUMvQixNQUFNLFdBQVcsR0FBRyxvQkFBb0IsQ0FBQztBQUV6QyxNQUFNLGlCQUFpQixHQUFHLG1DQUFtQyxDQUFDO0FBRTlELE1BQU0sY0FBYyxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsWUFBWSxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUM7QUFFOUQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLFlBQVksRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDO0FBRWhFLE1BQU0sZUFBZSxHQUFHLElBQUksR0FBRyxDQUFDO0lBQzlCLE1BQU07SUFDTixPQUFPO0lBQ1AsT0FBTztJQUNQLFFBQVE7SUFDUixLQUFLO0lBQ0wsTUFBTTtJQUNOLFFBQVE7SUFDUixTQUFTO0lBQ1QsTUFBTTtJQUNOLE9BQU87SUFDUCxJQUFJO0lBQ0osS0FBSztJQUNMLEtBQUs7SUFDTCxNQUFNO0NBQ1AsQ0FBQyxDQUFDO0FBRUgsTUFBTSxjQUFjLEdBQUcsR0FBRyxDQUFDO0FBUzNCLE1BQU0sWUFBWSxHQUFHLElBQUksU0FBUyxDQUFDO0lBQ2pDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7SUFDOUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztJQUM5QyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO0lBQzlDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7SUFDOUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztJQUM5QyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO0lBQzlDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7SUFDOUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFD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LEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEtBQUs7SUFDdkMsS0FBSyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRTtJQUM1QyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO0lBQ3RDLEVBQUUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEtBQUs7SUFDL0MsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRTtJQUN0QyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO0lBQ3RDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUU7SUFDNUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRTtJQUN0QyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO0lBQ3RDLEVBQUUs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QUUsR0FBRyxDQUFDLFFBQVE7UUFDdEIsSUFBSSxFQUFFLEdBQUcsR0FBRyxDQUFDLFFBQVEsSUFBSSxFQUFFLEdBQUcsR0FBRyxDQUFDLE1BQU0sSUFBSSxFQUFFLEVBQUU7UUFDaEQsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJO0tBQ2YsQ0FBQztJQUNGLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxFQUFFLEVBQUU7UUFDbkIsT0FBTyxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ2pDO0lBQ0QsSUFBSSxHQUFHLENBQUMsUUFBUSxJQUFJLEdBQUcsQ0FBQyxRQUFRLEVBQUU7UUFDaEMsT0FBTyxDQUFDLElBQUksR0FBRyxHQUFHLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFDaEQsa0JBQWtCLENBQ2hCLEdBQUcsQ0FBQyxRQUFRLENBRWhCLEVBQUUsQ0FBQztLQUNKO0lBQ0QsT0FBTyxPQUFPLENBQUM7QUFDakIsQ0FBQztBQUVELGVBQWU7SUFDYixLQUFLO0lBQ0wsTUFBTTtJQUNOLGFBQWE7SUFDYixhQUFhO0lBQ2IsYUFBYTtJQUNiLGdCQUFnQjtJQUNoQixHQUFHO0lBQ0gsR0FBRztDQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuaW1wb3J0IHtcbiAgRVJSX0lOVkFMSURfQVJHX1RZUEUsXG4gIEVSUl9JTlZBTElEX0FSR19WQUxVRSxcbiAgRVJSX0lOVkFMSURfRklMRV9VUkxfSE9TVCxcbiAgRVJSX0lOVkFMSURfRklMRV9VUkxfUEFUSCxcbiAgRVJSX0lOVkFMSURfVVJMX1NDSEVNRSxcbn0gZnJvbSBcIi4vX2Vycm9ycy50c1wiO1xuaW1wb3J0IHtcbiAgQ0hBUl8wLFxuICBDSEFSXzksXG4gIENIQVJfQVQsXG4gIENIQVJfQkFDS1dBUkRfU0xBU0gsXG4gIENIQVJfQ0FSUklBR0VfUkVUVVJOLFxuICBDSEFSX0NJUkNVTUZMRVhfQUNDRU5ULFxuICBDSEFSX0RPVCxcbiAgQ0hBUl9ET1VCTEVfUVVPVEUsXG4gIENIQVJfRk9STV9GRUVELFxuICBDSEFSX0ZPUldBUkRfU0xBU0gsXG4gIENIQVJfR1JBVkVfQUNDRU5ULFxuICBDSEFSX0hBU0gsXG4gIENIQVJfSFlQSEVOX01JTlVTLFxuICBDSEFSX0xFRlRfQU5HTEVfQlJBQ0tFVCxcbiAgQ0hBUl9MRUZUX0NVUkxZX0JSQUNLRVQsXG4gIENIQVJfTEVGVF9TUVVBUkVfQlJBQ0tFVCxcbiAgQ0hBUl9MSU5FX0ZFRUQsXG4gIENIQVJfTE9XRVJDQVNFX0EsXG4gIENIQVJfTE9XRVJDQVNFX1osXG4gIENIQVJfTk9fQlJFQUtfU1BBQ0UsXG4gIENIQVJfUEVSQ0VOVCxcbiAgQ0hBUl9QTFVTLFxuICBDSEFSX1FVRVNUSU9OX01BUkssXG4gIENIQVJfUklHSFRfQU5HTEVfQlJBQ0tFVCxcbiAgQ0hBUl9SSUdIVF9DVVJMWV9CUkFDS0VULFxuICBDSEFSX1JJR0hUX1NRVUFSRV9CUkFDS0VULFxuICBDSEFSX1NFTUlDT0xPTixcbiAgQ0hBUl9TSU5HTEVfUVVPVEUsXG4gIENIQVJfU1BBQ0UsXG4gIENIQVJfVEFCLFxuICBDSEFSX1VOREVSU0NPUkUsXG4gIENIQVJfVVBQRVJDQVNFX0EsXG4gIENIQVJfVVBQRVJDQVNFX1osXG4gIENIQVJfVkVSVElDQUxfTElORSxcbiAgQ0hBUl9aRVJPX1dJRFRIX05PQlJFQUtfU1BBQ0UsXG59IGZyb20gXCIuLi9wYXRoL19jb25zdGFudHMudHNcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcIi4vcGF0aC50c1wiO1xuaW1wb3J0IHsgdG9BU0NJSSB9IGZyb20gXCIuL2ludGVybmFsL2lkbmEudHNcIjtcbmltcG9ydCB7IGlzV2luZG93cywgb3NUeXBlIH0gZnJvbSBcIi4uL191dGlsL29zLnRzXCI7XG5pbXBvcnQgeyBlbmNvZGVTdHIsIGhleFRhYmxlIH0gZnJvbSBcIi4vaW50ZXJuYWwvcXVlcnlzdHJpbmcudHNcIjtcblxuY29uc3QgZm9yd2FyZFNsYXNoUmVnRXggPSAvXFwvL2c7XG5jb25zdCBwZXJjZW50UmVnRXggPSAvJS9nO1xuY29uc3QgYmFja3NsYXNoUmVnRXggPSAvXFxcXC9nO1xuY29uc3QgbmV3bGluZVJlZ0V4ID0gL1xcbi9nO1xuY29uc3QgY2FycmlhZ2VSZXR1cm5SZWdFeCA9IC9cXHIvZztcbmNvbnN0IHRhYlJlZ0V4ID0gL1xcdC9nO1xuLy8gUmVmZXJlbmNlOiBSRkMgMzk4NiwgUkZDIDE4MDgsIFJGQyAyMzk2XG5cbi8vIGRlZmluZSB0aGVzZSBoZXJlIHNvIGF0IGxlYXN0IHRoZXkgb25seSBoYXZlIHRvIGJlXG4vLyBjb21waWxlZCBvbmNlIG9uIHRoZSBmaXJzdCBtb2R1bGUgbG9hZC5cbmNvbnN0IHByb3RvY29sUGF0dGVybiA9IC9eW2EtejAtOS4rLV0rOi9pO1xuY29uc3QgcG9ydFBhdHRlcm4gPSAvOlswLTldKiQvO1xuY29uc3QgaG9zdFBhdHRlcm4gPSAvXlxcL1xcL1teQC9dK0BbXkAvXSsvO1xuLy8gU3BlY2lhbCBjYXNlIGZvciBhIHNpbXBsZSBwYXRoIFVSTFxuY29uc3Qgc2ltcGxlUGF0aFBhdHRlcm4gPSAvXihcXC9cXC8/KD8hXFwvKVteP1xcc10qKShcXD9bXlxcc10qKT8kLztcbi8vIFByb3RvY29scyB0aGF0IGNhbiBhbGxvdyBcInVuc2FmZVwiIGFuZCBcInVud2lzZVwiIGNoYXJzLlxuY29uc3QgdW5zYWZlUHJvdG9jb2wgPSBuZXcgU2V0KFtcImphdmFzY3JpcHRcIiwgXCJqYXZhc2NyaXB0OlwiXSk7XG4vLyBQcm90b2NvbHMgdGhhdCBuZXZlciBoYXZlIGEgaG9zdG5hbWUuXG5jb25zdCBob3N0bGVzc1Byb3RvY29sID0gbmV3IFNldChbXCJqYXZhc2NyaXB0XCIsIFwiamF2YXNjcmlwdDpcIl0pO1xuLy8gUHJvdG9jb2xzIHRoYXQgYWx3YXlzIGNvbnRhaW4gYSAvLyBiaXQuXG5jb25zdCBzbGFzaGVkUHJvdG9jb2wgPSBuZXcgU2V0KFtcbiAgXCJodHRwXCIsXG4gIFwiaHR0cDpcIixcbiAgXCJodHRwc1wiLFxuICBcImh0dHBzOlwiLFxuICBcImZ0cFwiLFxuICBcImZ0cDpcIixcbiAgXCJnb3BoZXJcIixcbiAgXCJnb3BoZXI6XCIsXG4gIFwiZmlsZVwiLFxuICBcImZpbGU6XCIsXG4gIFwid3NcIixcbiAgXCJ3czpcIixcbiAgXCJ3c3NcIixcbiAgXCJ3c3M6XCIsXG5dKTtcblxuY29uc3QgaG9zdG5hbWVNYXhMZW4gPSAyNTU7XG5cbi8vIFRoZXNlIGNoYXJhY3RlcnMgZG8gbm90IG5lZWQgZXNjYXBpbmc6XG4vLyAhIC0gLiBfIH5cbi8vICcgKCApICogOlxuLy8gZGlnaXRzXG4vLyBhbHBoYSAodXBwZXJjYXNlKVxuLy8gYWxwaGEgKGxvd2VyY2FzZSlcbi8vIGRlbm8tZm10LWlnbm9yZVxuY29uc3Qgbm9Fc2NhcGVBdXRoID0gbmV3IEludDhBcnJheShbXG4gIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIC8vIDB4MDAgLSAweDBGXG4gIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIC8vIDB4MTAgLSAweDFGXG4gIDAsIDEsIDAsIDAsIDAsIDAsIDAsIDEsIDEsIDEsIDEsIDAsIDAsIDEsIDEsIDAsIC8vIDB4MjAgLSAweDJGXG4gIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDAsIDAsIDAsIDAsIDAsIC8vIDB4MzAgLSAweDNGXG4gIDAsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIC8vIDB4NDAgLSAweDRGXG4gIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDAsIDAsIDAsIDAsIDEsIC8vIDB4NTAgLSAweDVGXG4gIDAsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIC8vIDB4NjAgLSAweDZGXG4gIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDEsIDAsIDAsIDAsIDEsIDAsICAvLyAweDcwIC0gMHg3RlxuXSk7XG5cbi8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG5sZXQgcXVlcnlzdHJpbmc6IGFueSA9IG51bGw7XG5cbmNvbnN0IF91cmwgPSBVUkw7XG5leHBvcnQgeyBfdXJsIGFzIFVSTCB9O1xuXG4vLyBMZWdhY3kgVVJMIEFQSVxuZXhwb3J0IGNsYXNzIFVybCB7XG4gIHB1YmxpYyBwcm90b2NvbDogc3RyaW5nIHwgbnVsbDtcbiAgcHVibGljIHNsYXNoZXM6IGJvb2xlYW4gfCBudWxsO1xuICBwdWJsaWMgYXV0aDogc3RyaW5nIHwgbnVsbDtcbiAgcHVibGljIGhvc3Q6IHN0cmluZyB8IG51bGw7XG4gIHB1YmxpYyBwb3J0OiBzdHJpbmcgfCBudWxsO1xuICBwdWJsaWMgaG9zdG5hbWU6IHN0cmluZyB8IG51bGw7XG4gIHB1YmxpYyBoYXNoOiBzdHJpbmcgfCBudWxsO1xuICBwdWJsaWMgc2VhcmNoOiBzdHJpbmcgfCBudWxsO1xuICBwdWJsaWMgcXVlcnk6IHN0cmluZyB8IG51bGw7XG4gIHB1YmxpYyBwYXRobmFtZTogc3RyaW5nIHwgbnVsbDtcbiAgcHVibGljIHBhdGg6IHN0cmluZyB8IG51bGw7XG4gIHB1YmxpYyBocmVmOiBzdHJpbmcgfCBudWxsO1xuICBba2V5OiBzdHJpbmddOiB1bmtub3duXG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5wcm90b2NvbCA9IG51bGw7XG4gICAgdGhpcy5zbGFzaGVzID0gbnVsbDtcbiAgICB0aGlzLmF1dGggPSBudWxsO1xuICAgIHRoaXMuaG9zdCA9IG51bGw7XG4gICAgdGhpcy5wb3J0ID0gbnVsbDtcbiAgICB0aGlzLmhvc3RuYW1lID0gbnVsbDtcbiAgICB0aGlzLmhhc2ggPSBudWxsO1xuICAgIHRoaXMuc2VhcmNoID0gbnVsbDtcbiAgICB0aGlzLnF1ZXJ5ID0gbnVsbDtcbiAgICB0aGlzLnBhdGhuYW1lID0gbnVsbDtcbiAgICB0aGlzLnBhdGggPSBudWxsO1xuICAgIHRoaXMuaHJlZiA9IG51bGw7XG4gIH1cblxuICBwcml2YXRlIHBhcnNlSG9zdCgpIHtcbiAgICBsZXQgaG9zdCA9IHRoaXMuaG9zdCB8fCBcIlwiO1xuICAgIGxldCBwb3J0OiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsIHwgc3RyaW5nID0gcG9ydFBhdHRlcm4uZXhlYyhob3N0KTtcbiAgICBpZiAocG9ydCkge1xuICAgICAgcG9ydCA9IHBvcnRbMF07XG4gICAgICBpZiAocG9ydCAhPT0gXCI6XCIpIHtcbiAgICAgICAgdGhpcy5wb3J0ID0gcG9ydC5zbGljZSgxKTtcbiAgICAgIH1cbiAgICAgIGhvc3QgPSBob3N0LnNsaWNlKDAsIGhvc3QubGVuZ3RoIC0gcG9ydC5sZW5ndGgpO1xuICAgIH1cbiAgICBpZiAoaG9zdCkgdGhpcy5ob3N0bmFtZSA9IGhvc3Q7XG4gIH1cblxuICBwdWJsaWMgcmVzb2x2ZU9iamVjdChyZWxhdGl2ZTogc3RyaW5nIHwgVXJsKSB7XG4gICAgaWYgKHR5cGVvZiByZWxhdGl2ZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgY29uc3QgcmVsID0gbmV3IFVybCgpO1xuICAgICAgcmVsLnVybFBhcnNlKHJlbGF0aXZlLCBmYWxzZSwgdHJ1ZSk7XG4gICAgICByZWxhdGl2ZSA9IHJlbDtcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQgPSBuZXcgVXJsKCk7XG4gICAgY29uc3QgdGtleXMgPSBPYmplY3Qua2V5cyh0aGlzKTtcbiAgICBmb3IgKGxldCB0ayA9IDA7IHRrIDwgdGtleXMubGVuZ3RoOyB0aysrKSB7XG4gICAgICBjb25zdCB0a2V5ID0gdGtleXNbdGtdO1xuICAgICAgcmVzdWx0W3RrZXldID0gdGhpc1t0a2V5XTtcbiAgICB9XG5cbiAgICAvLyBIYXNoIGlzIGFsd2F5cyBvdmVycmlkZGVuLCBubyBtYXR0ZXIgd2hhdC5cbiAgICAvLyBldmVuIGhyZWY9XCJcIiB3aWxsIHJlbW92ZSBpdC5cbiAgICByZXN1bHQuaGFzaCA9IHJlbGF0aXZlLmhhc2g7XG5cbiAgICAvLyBJZiB0aGUgcmVsYXRpdmUgdXJsIGlzIGVtcHR5LCB0aGVuIHRoZXJlJ3Mgbm90aGluZyBsZWZ0IHRvIGRvIGhlcmUuXG4gICAgaWYgKHJlbGF0aXZlLmhyZWYgPT09IFwiXCIpIHtcbiAgICAgIHJlc3VsdC5ocmVmID0gcmVzdWx0LmZvcm1hdCgpO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvLyBIcmVmcyBsaWtlIC8vZm9vL2JhciBhbHdheXMgY3V0IHRvIHRoZSBwcm90b2NvbC5cbiAgICBpZiAocmVsYXRpdmUuc2xhc2hlcyAmJiAhcmVsYXRpdmUucHJvdG9jb2wpIHtcbiAgICAgIC8vIFRha2UgZXZlcnl0aGluZyBleGNlcHQgdGhlIHByb3RvY29sIGZyb20gcmVsYXRpdmVcbiAgICAgIGNvbnN0IHJrZXlzID0gT2JqZWN0LmtleXMocmVsYXRpdmUpO1xuICAgICAgZm9yIChsZXQgcmsgPSAwOyByayA8IHJrZXlzLmxlbmd0aDsgcmsrKykge1xuICAgICAgICBjb25zdCBya2V5ID0gcmtleXNbcmtdO1xuICAgICAgICBpZiAocmtleSAhPT0gXCJwcm90b2NvbFwiKSByZXN1bHRbcmtleV0gPSByZWxhdGl2ZVtya2V5XTtcbiAgICAgIH1cblxuICAgICAgLy8gdXJsUGFyc2UgYXBwZW5kcyB0cmFpbGluZyAvIHRvIHVybHMgbGlrZSBodHRwOi8vd3d3LmV4YW1wbGUuY29tXG4gICAgICBpZiAoXG4gICAgICAgIHJlc3VsdC5wcm90b2NvbCAmJiBzbGFzaGVkUHJvdG9jb2wuaGFzKHJlc3VsdC5wcm90b2NvbCkgJiZcbiAgICAgICAgcmVzdWx0Lmhvc3RuYW1lICYmXG4gICAgICAgICFyZXN1bHQucGF0aG5hbWVcbiAgICAgICkge1xuICAgICAgICByZXN1bHQucGF0aCA9IHJlc3VsdC5wYXRobmFtZSA9IFwiL1wiO1xuICAgICAgfVxuXG4gICAgICByZXN1bHQuaHJlZiA9IHJlc3VsdC5mb3JtYXQoKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgaWYgKHJlbGF0aXZlLnByb3RvY29sICYmIHJlbGF0aXZlLnByb3RvY29sICE9PSByZXN1bHQucHJvdG9jb2wpIHtcbiAgICAgIC8vIElmIGl0J3MgYSBrbm93biB1cmwgcHJvdG9jb2wsIHRoZW4gY2hhbmdpbmdcbiAgICAgIC8vIHRoZSBwcm90b2NvbCBkb2VzIHdlaXJkIHRoaW5nc1xuICAgICAgLy8gZmlyc3QsIGlmIGl0J3Mgbm90IGZpbGU6LCB0aGVuIHdlIE1VU1QgaGF2ZSBhIGhvc3QsXG4gICAgICAvLyBhbmQgaWYgdGhlcmUgd2FzIGEgcGF0aFxuICAgICAgLy8gdG8gYmVnaW4gd2l0aCwgdGhlbiB3ZSBNVVNUIGhhdmUgYSBwYXRoLlxuICAgICAgLy8gaWYgaXQgaXMgZmlsZTosIHRoZW4gdGhlIGhvc3QgaXMgZHJvcHBlZCxcbiAgICAgIC8vIGJlY2F1c2UgdGhhdCdzIGtub3duIHRvIGJlIGhvc3RsZXNzLlxuICAgICAgLy8gYW55dGhpbmcgZWxzZSBpcyBhc3N1bWVkIHRvIGJlIGFic29sdXRlLlxuICAgICAgaWYgKCFzbGFzaGVkUHJvdG9jb2wuaGFzKHJlbGF0aXZlLnByb3RvY29sKSkge1xuICAgICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMocmVsYXRpdmUpO1xuICAgICAgICBmb3IgKGxldCB2ID0gMDsgdiA8IGtleXMubGVuZ3RoOyB2KyspIHtcbiAgICAgICAgICBjb25zdCBrID0ga2V5c1t2XTtcbiAgICAgICAgICByZXN1bHRba10gPSByZWxhdGl2ZVtrXTtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQuaHJlZiA9IHJlc3VsdC5mb3JtYXQoKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cblxuICAgICAgcmVzdWx0LnByb3RvY29sID0gcmVsYXRpdmUucHJvdG9jb2w7XG4gICAgICBpZiAoXG4gICAgICAgICFyZWxhdGl2ZS5ob3N0ICYmXG4gICAgICAgICEvXmZpbGU6PyQvLnRlc3QocmVsYXRpdmUucHJvdG9jb2wpICYmXG4gICAgICAgICFob3N0bGVzc1Byb3RvY29sLmhhcyhyZWxhdGl2ZS5wcm90b2NvbClcbiAgICAgICkge1xuICAgICAgICBjb25zdCByZWxQYXRoID0gKHJlbGF0aXZlLnBhdGhuYW1lIHx8IFwiXCIpLnNwbGl0KFwiL1wiKTtcbiAgICAgICAgd2hpbGUgKHJlbFBhdGgubGVuZ3RoICYmICEocmVsYXRpdmUuaG9zdCA9IHJlbFBhdGguc2hpZnQoKSB8fCBudWxsKSk7XG4gICAgICAgIGlmICghcmVsYXRpdmUuaG9zdCkgcmVsYXRpdmUuaG9zdCA9IFwiXCI7XG4gICAgICAgIGlmICghcmVsYXRpdmUuaG9zdG5hbWUpIHJlbGF0aXZlLmhvc3RuYW1lID0gXCJcIjtcbiAgICAgICAgaWYgKHJlbFBhdGhbMF0gIT09IFwiXCIpIHJlbFBhdGgudW5zaGlmdChcIlwiKTtcbiAgICAgICAgaWYgKHJlbFBhdGgubGVuZ3RoIDwgMikgcmVsUGF0aC51bnNoaWZ0KFwiXCIpO1xuICAgICAgICByZXN1bHQucGF0aG5hbWUgPSByZWxQYXRoLmpvaW4oXCIvXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0LnBhdGhuYW1lID0gcmVsYXRpdmUucGF0aG5hbWU7XG4gICAgICB9XG4gICAgICByZXN1bHQuc2VhcmNoID0gcmVsYXRpdmUuc2VhcmNoO1xuICAgICAgcmVzdWx0LnF1ZXJ5ID0gcmVsYXRpdmUucXVlcnk7XG4gICAgICByZXN1bHQuaG9zdCA9IHJlbGF0aXZlLmhvc3QgfHwgXCJcIjtcbiAgICAgIHJlc3VsdC5hdXRoID0gcmVsYXRpdmUuYXV0aDtcbiAgICAgIHJlc3VsdC5ob3N0bmFtZSA9IHJlbGF0aXZlLmhvc3RuYW1lIHx8IHJlbGF0aXZlLmhvc3Q7XG4gICAgICByZXN1bHQucG9ydCA9IHJlbGF0aXZlLnBvcnQ7XG4gICAgICAvLyBUbyBzdXBwb3J0IGh0dHAucmVxdWVzdFxuICAgICAgaWYgKHJlc3VsdC5wYXRobmFtZSB8fCByZXN1bHQuc2VhcmNoKSB7XG4gICAgICAgIGNvbnN0IHAgPSByZXN1bHQucGF0aG5hbWUgfHwgXCJcIjtcbiAgICAgICAgY29uc3QgcyA9IHJlc3VsdC5zZWFyY2ggfHwgXCJcIjtcbiAgICAgICAgcmVzdWx0LnBhdGggPSBwICsgcztcbiAgICAgIH1cbiAgICAgIHJlc3VsdC5zbGFzaGVzID0gcmVzdWx0LnNsYXNoZXMgfHwgcmVsYXRpdmUuc2xhc2hlcztcbiAgICAgIHJlc3VsdC5ocmVmID0gcmVzdWx0LmZvcm1hdCgpO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBjb25zdCBpc1NvdXJjZUFicyA9IHJlc3VsdC5wYXRobmFtZSAmJiByZXN1bHQucGF0aG5hbWUuY2hhckF0KDApID09PSBcIi9cIjtcbiAgICBjb25zdCBpc1JlbEFicyA9IHJlbGF0aXZlLmhvc3QgfHxcbiAgICAgIChyZWxhdGl2ZS5wYXRobmFtZSAmJiByZWxhdGl2ZS5wYXRobmFtZS5jaGFyQXQoMCkgPT09IFwiL1wiKTtcbiAgICBsZXQgbXVzdEVuZEFiczogc3RyaW5nIHwgYm9vbGVhbiB8IG51bWJlciB8IG51bGwgPSBpc1JlbEFicyB8fFxuICAgICAgaXNTb3VyY2VBYnMgfHwgKHJlc3VsdC5ob3N0ICYmIHJlbGF0aXZlLnBhdGhuYW1lKTtcbiAgICBjb25zdCByZW1vdmVBbGxEb3RzID0gbXVzdEVuZEFicztcbiAgICBsZXQgc3JjUGF0aCA9IChyZXN1bHQucGF0aG5hbWUgJiYgcmVzdWx0LnBhdGhuYW1lLnNwbGl0KFwiL1wiKSkgfHwgW107XG4gICAgY29uc3QgcmVsUGF0aCA9IChyZWxhdGl2ZS5wYXRobmFtZSAmJiByZWxhdGl2ZS5wYXRobmFtZS5zcGxpdChcIi9cIikpIHx8IFtdO1xuICAgIGNvbnN0IG5vTGVhZGluZ1NsYXNoZXMgPSByZXN1bHQucHJvdG9jb2wgJiZcbiAgICAgICFzbGFzaGVkUHJvdG9jb2wuaGFzKHJlc3VsdC5wcm90b2NvbCk7XG5cbiAgICAvLyBJZiB0aGUgdXJsIGlzIGEgbm9uLXNsYXNoZWQgdXJsLCB0aGVuIHJlbGF0aXZlXG4gICAgLy8gbGlua3MgbGlrZSAuLi8uLiBzaG91bGQgYmUgYWJsZVxuICAgIC8vIHRvIGNyYXdsIHVwIHRvIHRoZSBob3N0bmFtZSwgYXMgd2VsbC4gIFRoaXMgaXMgc3RyYW5nZS5cbiAgICAvLyByZXN1bHQucHJvdG9jb2wgaGFzIGFscmVhZHkgYmVlbiBzZXQgYnkgbm93LlxuICAgIC8vIExhdGVyIG9uLCBwdXQgdGhlIGZpcnN0IHBhdGggcGFydCBpbnRvIHRoZSBob3N0IGZpZWxkLlxuICAgIGlmIChub0xlYWRpbmdTbGFzaGVzKSB7XG4gICAgICByZXN1bHQuaG9zdG5hbWUgPSBcIlwiO1xuICAgICAgcmVzdWx0LnBvcnQgPSBudWxsO1xuICAgICAgaWYgKHJlc3VsdC5ob3N0KSB7XG4gICAgICAgIGlmIChzcmNQYXRoWzBdID09PSBcIlwiKSBzcmNQYXRoWzBdID0gcmVzdWx0Lmhvc3Q7XG4gICAgICAgIGVsc2Ugc3JjUGF0aC51bnNoaWZ0KHJlc3VsdC5ob3N0KTtcbiAgICAgIH1cbiAgICAgIHJlc3VsdC5ob3N0ID0gXCJcIjtcbiAgICAgIGlmIChyZWxhdGl2ZS5wcm90b2NvbCkge1xuICAgICAgICByZWxhdGl2ZS5ob3N0bmFtZSA9IG51bGw7XG4gICAgICAgIHJlbGF0aXZlLnBvcnQgPSBudWxsO1xuICAgICAgICByZXN1bHQuYXV0aCA9IG51bGw7XG4gICAgICAgIGlmIChyZWxhdGl2ZS5ob3N0KSB7XG4gICAgICAgICAgaWYgKHJlbFBhdGhbMF0gPT09IFwiXCIpIHJlbFBhdGhbMF0gPSByZWxhdGl2ZS5ob3N0O1xuICAgICAgICAgIGVsc2UgcmVsUGF0aC51bnNoaWZ0KHJlbGF0aXZlLmhvc3QpO1xuICAgICAgICB9XG4gICAgICAgIHJlbGF0aXZlLmhvc3QgPSBudWxsO1xuICAgICAgfVxuICAgICAgbXVzdEVuZEFicyA9IG11c3RFbmRBYnMgJiZcbiAgICAgICAgKHJlbFBhdGhbMF0gPT09IFwiXCIgfHwgc3JjUGF0aFswXSA9PT0gXCJcIik7XG4gICAgfVxuXG4gICAgaWYgKGlzUmVsQWJzKSB7XG4gICAgICAvLyBpdCdzIGFic29sdXRlLlxuICAgICAgaWYgKHJlbGF0aXZlLmhvc3QgfHwgcmVsYXRpdmUuaG9zdCA9PT0gXCJcIikge1xuICAgICAgICBpZiAocmVzdWx0Lmhvc3QgIT09IHJlbGF0aXZlLmhvc3QpIHJlc3VsdC5hdXRoID0gbnVsbDtcbiAgICAgICAgcmVzdWx0Lmhvc3QgPSByZWxhdGl2ZS5ob3N0O1xuICAgICAgICByZXN1bHQucG9ydCA9IHJlbGF0aXZlLnBvcnQ7XG4gICAgICB9XG4gICAgICBpZiAocmVsYXRpdmUuaG9zdG5hbWUgfHwgcmVsYXRpdmUuaG9zdG5hbWUgPT09IFwiXCIpIHtcbiAgICAgICAgaWYgKHJlc3VsdC5ob3N0bmFtZSAhPT0gcmVsYXRpdmUuaG9zdG5hbWUpIHJlc3VsdC5hdXRoID0gbnVsbDtcbiAgICAgICAgcmVzdWx0Lmhvc3RuYW1lID0gcmVsYXRpdmUuaG9zdG5hbWU7XG4gICAgICB9XG4gICAgICByZXN1bHQuc2VhcmNoID0gcmVsYXRpdmUuc2VhcmNoO1xuICAgICAgcmVzdWx0LnF1ZXJ5ID0gcmVsYXRpdmUucXVlcnk7XG4gICAgICBzcmNQYXRoID0gcmVsUGF0aDtcbiAgICAgIC8vIEZhbGwgdGhyb3VnaCB0byB0aGUgZG90LWhhbmRsaW5nIGJlbG93LlxuICAgIH0gZWxzZSBpZiAocmVsUGF0aC5sZW5ndGgpIHtcbiAgICAgIC8vIGl0J3MgcmVsYXRpdmVcbiAgICAgIC8vIHRocm93IGF3YXkgdGhlIGV4aXN0aW5nIGZpbGUsIGFuZCB0YWtlIHRoZSBuZXcgcGF0aCBpbnN0ZWFkLlxuICAgICAgaWYgKCFzcmNQYXRoKSBzcmNQYXRoID0gW107XG4gICAgICBzcmNQYXRoLnBvcCgpO1xuICAgICAgc3JjUGF0aCA9IHNyY1BhdGguY29uY2F0KHJlbFBhdGgpO1xuICAgICAgcmVzdWx0LnNlYXJjaCA9IHJlbGF0aXZlLnNlYXJjaDtcbiAgICAgIHJlc3VsdC5xdWVyeSA9IHJlbGF0aXZlLnF1ZXJ5O1xuICAgIH0gZWxzZSBpZiAocmVsYXRpdmUuc2VhcmNoICE9PSBudWxsICYmIHJlbGF0aXZlLnNlYXJjaCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBKdXN0IHB1bGwgb3V0IHRoZSBzZWFyY2guXG4gICAgICAvLyBsaWtlIGhyZWY9Jz9mb28nLlxuICAgICAgLy8gUHV0IHRoaXMgYWZ0ZXIgdGhlIG90aGVyIHR3byBjYXNlcyBiZWNhdXNlIGl0IHNpbXBsaWZpZXMgdGhlIGJvb2xlYW5zXG4gICAgICBpZiAobm9MZWFkaW5nU2xhc2hlcykge1xuICAgICAgICByZXN1bHQuaG9zdG5hbWUgPSByZXN1bHQuaG9zdCA9IHNyY1BhdGguc2hpZnQoKSB8fCBudWxsO1xuICAgICAgICAvLyBPY2Nhc2lvbmFsbHkgdGhlIGF1dGggY2FuIGdldCBzdHVjayBvbmx5IGluIGhvc3QuXG4gICAgICAgIC8vIFRoaXMgZXNwZWNpYWxseSBoYXBwZW5zIGluIGNhc2VzIGxpa2VcbiAgICAgICAgLy8gdXJsLnJlc29sdmVPYmplY3QoJ21haWx0bzpsb2NhbDFAZG9tYWluMScsICdsb2NhbDJAZG9tYWluMicpXG4gICAgICAgIGNvbnN0IGF1dGhJbkhvc3QgPSByZXN1bHQuaG9zdCAmJlxuICAgICAgICAgIHJlc3VsdC5ob3N0LmluZGV4T2YoXCJAXCIpID4gMCAmJlxuICAgICAgICAgIHJlc3VsdC5ob3N0LnNwbGl0KFwiQFwiKTtcbiAgICAgICAgaWYgKGF1dGhJbkhvc3QpIHtcbiAgICAgICAgICByZXN1bHQuYXV0aCA9IGF1dGhJbkhvc3Quc2hpZnQoKSB8fCBudWxsO1xuICAgICAgICAgIHJlc3VsdC5ob3N0ID0gcmVzdWx0Lmhvc3RuYW1lID0gYXV0aEluSG9zdC5zaGlmdCgpIHx8IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJlc3VsdC5zZWFyY2ggPSByZWxhdGl2ZS5zZWFyY2g7XG4gICAgICByZXN1bHQucXVlcnkgPSByZWxhdGl2ZS5xdWVyeTtcbiAgICAgIC8vIFRvIHN1cHBvcnQgaHR0cC5yZXF1ZXN0XG4gICAgICBpZiAocmVzdWx0LnBhdGhuYW1lICE9PSBudWxsIHx8IHJlc3VsdC5zZWFyY2ggIT09IG51bGwpIHtcbiAgICAgICAgcmVzdWx0LnBhdGggPSAocmVzdWx0LnBhdGhuYW1lID8gcmVzdWx0LnBhdGhuYW1lIDogXCJcIikgK1xuICAgICAgICAgIChyZXN1bHQuc2VhcmNoID8gcmVzdWx0LnNlYXJjaCA6IFwiXCIpO1xuICAgICAgfVxuICAgICAgcmVzdWx0LmhyZWYgPSByZXN1bHQuZm9ybWF0KCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGlmICghc3JjUGF0aC5sZW5ndGgpIHtcbiAgICAgIC8vIE5vIHBhdGggYXQgYWxsLiBBbGwgb3RoZXIgdGhpbmdzIHdlcmUgYWxyZWFkeSBoYW5kbGVkIGFib3ZlLlxuICAgICAgcmVzdWx0LnBhdGhuYW1lID0gbnVsbDtcbiAgICAgIC8vIFRvIHN1cHBvcnQgaHR0cC5yZXF1ZXN0XG4gICAgICBpZiAocmVzdWx0LnNlYXJjaCkge1xuICAgICAgICByZXN1bHQucGF0aCA9IFwiL1wiICsgcmVzdWx0LnNlYXJjaDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdC5wYXRoID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIHJlc3VsdC5ocmVmID0gcmVzdWx0LmZvcm1hdCgpO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICAvLyBJZiBhIHVybCBFTkRzIGluIC4gb3IgLi4sIHRoZW4gaXQgbXVzdCBnZXQgYSB0cmFpbGluZyBzbGFzaC5cbiAgICAvLyBob3dldmVyLCBpZiBpdCBlbmRzIGluIGFueXRoaW5nIGVsc2Ugbm9uLXNsYXNoeSxcbiAgICAvLyB0aGVuIGl0IG11c3QgTk9UIGdldCBhIHRyYWlsaW5nIHNsYXNoLlxuICAgIGxldCBsYXN0ID0gc3JjUGF0aC5zbGljZSgtMSlbMF07XG4gICAgY29uc3QgaGFzVHJhaWxpbmdTbGFzaCA9XG4gICAgICAoKHJlc3VsdC5ob3N0IHx8IHJlbGF0aXZlLmhvc3QgfHwgc3JjUGF0aC5sZW5ndGggPiAxKSAmJlxuICAgICAgICAobGFzdCA9PT0gXCIuXCIgfHwgbGFzdCA9PT0gXCIuLlwiKSkgfHxcbiAgICAgIGxhc3QgPT09IFwiXCI7XG5cbiAgICAvLyBTdHJpcCBzaW5nbGUgZG90cywgcmVzb2x2ZSBkb3VibGUgZG90cyB0byBwYXJlbnQgZGlyXG4gICAgLy8gaWYgdGhlIHBhdGggdHJpZXMgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIGB1cGAgZW5kcyB1cCA+IDBcbiAgICBsZXQgdXAgPSAwO1xuICAgIGZvciAobGV0IGkgPSBzcmNQYXRoLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBsYXN0ID0gc3JjUGF0aFtpXTtcbiAgICAgIGlmIChsYXN0ID09PSBcIi5cIikge1xuICAgICAgICBzcmNQYXRoLnNsaWNlKGkpO1xuICAgICAgfSBlbHNlIGlmIChsYXN0ID09PSBcIi4uXCIpIHtcbiAgICAgICAgc3JjUGF0aC5zbGljZShpKTtcbiAgICAgICAgdXArKztcbiAgICAgIH0gZWxzZSBpZiAodXApIHtcbiAgICAgICAgc3JjUGF0aC5zcGxpY2UoaSk7XG4gICAgICAgIHVwLS07XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIHBhdGggaXMgYWxsb3dlZCB0byBnbyBhYm92ZSB0aGUgcm9vdCwgcmVzdG9yZSBsZWFkaW5nIC4uc1xuICAgIGlmICghbXVzdEVuZEFicyAmJiAhcmVtb3ZlQWxsRG90cykge1xuICAgICAgd2hpbGUgKHVwLS0pIHtcbiAgICAgICAgc3JjUGF0aC51bnNoaWZ0KFwiLi5cIik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgbXVzdEVuZEFicyAmJlxuICAgICAgc3JjUGF0aFswXSAhPT0gXCJcIiAmJlxuICAgICAgKCFzcmNQYXRoWzBdIHx8IHNyY1BhdGhbMF0uY2hhckF0KDApICE9PSBcIi9cIilcbiAgICApIHtcbiAgICAgIHNyY1BhdGgudW5zaGlmdChcIlwiKTtcbiAgICB9XG5cbiAgICBpZiAoaGFzVHJhaWxpbmdTbGFzaCAmJiBzcmNQYXRoLmpvaW4oXCIvXCIpLnN1YnN0cigtMSkgIT09IFwiL1wiKSB7XG4gICAgICBzcmNQYXRoLnB1c2goXCJcIik7XG4gICAgfVxuXG4gICAgY29uc3QgaXNBYnNvbHV0ZSA9IHNyY1BhdGhbMF0gPT09IFwiXCIgfHxcbiAgICAgIChzcmNQYXRoWzBdICYmIHNyY1BhdGhbMF0uY2hhckF0KDApID09PSBcIi9cIik7XG5cbiAgICAvLyBwdXQgdGhlIGhvc3QgYmFja1xuICAgIGlmIChub0xlYWRpbmdTbGFzaGVzKSB7XG4gICAgICByZXN1bHQuaG9zdG5hbWUgPSByZXN1bHQuaG9zdCA9IGlzQWJzb2x1dGVcbiAgICAgICAgPyBcIlwiXG4gICAgICAgIDogc3JjUGF0aC5sZW5ndGhcbiAgICAgICAgPyBzcmNQYXRoLnNoaWZ0KCkgfHwgbnVsbFxuICAgICAgICA6IFwiXCI7XG4gICAgICAvLyBPY2Nhc2lvbmFsbHkgdGhlIGF1dGggY2FuIGdldCBzdHVjayBvbmx5IGluIGhvc3QuXG4gICAgICAvLyBUaGlzIGVzcGVjaWFsbHkgaGFwcGVucyBpbiBjYXNlcyBsaWtlXG4gICAgICAvLyB1cmwucmVzb2x2ZU9iamVjdCgnbWFpbHRvOmxvY2FsMUBkb21haW4xJywgJ2xvY2FsMkBkb21haW4yJylcbiAgICAgIGNvbnN0IGF1dGhJbkhvc3QgPSByZXN1bHQuaG9zdCAmJiByZXN1bHQuaG9zdC5pbmRleE9mKFwiQFwiKSA+IDBcbiAgICAgICAgPyByZXN1bHQuaG9zdC5zcGxpdChcIkBcIilcbiAgICAgICAgOiBmYWxzZTtcbiAgICAgIGlmIChhdXRoSW5Ib3N0KSB7XG4gICAgICAgIHJlc3VsdC5hdXRoID0gYXV0aEluSG9zdC5zaGlmdCgpIHx8IG51bGw7XG4gICAgICAgIHJlc3VsdC5ob3N0ID0gcmVzdWx0Lmhvc3RuYW1lID0gYXV0aEluSG9zdC5zaGlmdCgpIHx8IG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbXVzdEVuZEFicyA9IG11c3RFbmRBYnMgfHwgKHJlc3VsdC5ob3N0ICYmIHNyY1BhdGgubGVuZ3RoKTtcblxuICAgIGlmIChtdXN0RW5kQWJzICYmICFpc0Fic29sdXRlKSB7XG4gICAgICBzcmNQYXRoLnVuc2hpZnQoXCJcIik7XG4gICAgfVxuXG4gICAgaWYgKCFzcmNQYXRoLmxlbmd0aCkge1xuICAgICAgcmVzdWx0LnBhdGhuYW1lID0gbnVsbDtcbiAgICAgIHJlc3VsdC5wYXRoID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0LnBhdGhuYW1lID0gc3JjUGF0aC5qb2luKFwiL1wiKTtcbiAgICB9XG5cbiAgICAvLyBUbyBzdXBwb3J0IHJlcXVlc3QuaHR0cFxuICAgIGlmIChyZXN1bHQucGF0aG5hbWUgIT09IG51bGwgfHwgcmVzdWx0LnNlYXJjaCAhPT0gbnVsbCkge1xuICAgICAgcmVzdWx0LnBhdGggPSAocmVzdWx0LnBhdGhuYW1lID8gcmVzdWx0LnBhdGhuYW1lIDogXCJcIikgK1xuICAgICAgICAocmVzdWx0LnNlYXJjaCA/IHJlc3VsdC5zZWFyY2ggOiBcIlwiKTtcbiAgICB9XG4gICAgcmVzdWx0LmF1dGggPSByZWxhdGl2ZS5hdXRoIHx8IHJlc3VsdC5hdXRoO1xuICAgIHJlc3VsdC5zbGFzaGVzID0gcmVzdWx0LnNsYXNoZXMgfHwgcmVsYXRpdmUuc2xhc2hlcztcbiAgICByZXN1bHQuaHJlZiA9IHJlc3VsdC5mb3JtYXQoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcHJpdmF0ZSBmb3JtYXQoKSB7XG4gICAgbGV0IGF1dGggPSB0aGlzLmF1dGggfHwgXCJcIjtcbiAgICBpZiAoYXV0aCkge1xuICAgICAgYXV0aCA9IGVuY29kZVN0cihhdXRoLCBub0VzY2FwZUF1dGgsIGhleFRhYmxlKTtcbiAgICAgIGF1dGggKz0gXCJAXCI7XG4gICAgfVxuXG4gICAgbGV0IHByb3RvY29sID0gdGhpcy5wcm90b2NvbCB8fCBcIlwiO1xuICAgIGxldCBwYXRobmFtZSA9IHRoaXMucGF0aG5hbWUgfHwgXCJcIjtcbiAgICBsZXQgaGFzaCA9IHRoaXMuaGFzaCB8fCBcIlwiO1xuICAgIGxldCBob3N0ID0gXCJcIjtcbiAgICBsZXQgcXVlcnkgPSBcIlwiO1xuXG4gICAgaWYgKHRoaXMuaG9zdCkge1xuICAgICAgaG9zdCA9IGF1dGggKyB0aGlzLmhvc3Q7XG4gICAgfSBlbHNlIGlmICh0aGlzLmhvc3RuYW1lKSB7XG4gICAgICBob3N0ID0gYXV0aCArXG4gICAgICAgICh0aGlzLmhvc3RuYW1lLmluY2x1ZGVzKFwiOlwiKSAmJiAhaXNJcHY2SG9zdG5hbWUodGhpcy5ob3N0bmFtZSlcbiAgICAgICAgICA/IFwiW1wiICsgdGhpcy5ob3N0bmFtZSArIFwiXVwiXG4gICAgICAgICAgOiB0aGlzLmhvc3RuYW1lKTtcbiAgICAgIGlmICh0aGlzLnBvcnQpIHtcbiAgICAgICAgaG9zdCArPSBcIjpcIiArIHRoaXMucG9ydDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5xdWVyeSAhPT0gbnVsbCAmJiB0eXBlb2YgdGhpcy5xdWVyeSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgaWYgKHF1ZXJ5c3RyaW5nID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcXVlcnlzdHJpbmcgPSBpbXBvcnQoXCIuL3F1ZXJ5c3RyaW5nLnRzXCIpO1xuICAgICAgfVxuICAgICAgcXVlcnkgPSBxdWVyeXN0cmluZy5zdHJpbmdpZnkodGhpcy5xdWVyeSk7XG4gICAgfVxuXG4gICAgbGV0IHNlYXJjaCA9IHRoaXMuc2VhcmNoIHx8IChxdWVyeSAmJiBcIj9cIiArIHF1ZXJ5KSB8fCBcIlwiO1xuXG4gICAgaWYgKFxuICAgICAgcHJvdG9jb2wgJiZcbiAgICAgIHByb3RvY29sLmNoYXJDb2RlQXQocHJvdG9jb2wubGVuZ3RoIC0gMSkgIT09IDU4IC8qIDogKi9cbiAgICApIHtcbiAgICAgIHByb3RvY29sICs9IFwiOlwiO1xuICAgIH1cblxuICAgIGxldCBuZXdQYXRobmFtZSA9IFwiXCI7XG4gICAgbGV0IGxhc3RQb3MgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0aG5hbWUubGVuZ3RoOyArK2kpIHtcbiAgICAgIHN3aXRjaCAocGF0aG5hbWUuY2hhckNvZGVBdChpKSkge1xuICAgICAgICBjYXNlIENIQVJfSEFTSDpcbiAgICAgICAgICBpZiAoaSAtIGxhc3RQb3MgPiAwKSB7XG4gICAgICAgICAgICBuZXdQYXRobmFtZSArPSBwYXRobmFtZS5zbGljZShsYXN0UG9zLCBpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbmV3UGF0aG5hbWUgKz0gXCIlMjNcIjtcbiAgICAgICAgICBsYXN0UG9zID0gaSArIDE7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ0hBUl9RVUVTVElPTl9NQVJLOlxuICAgICAgICAgIGlmIChpIC0gbGFzdFBvcyA+IDApIHtcbiAgICAgICAgICAgIG5ld1BhdGhuYW1lICs9IHBhdGhuYW1lLnNsaWNlKGxhc3RQb3MsIGkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBuZXdQYXRobmFtZSArPSBcIiUzRlwiO1xuICAgICAgICAgIGxhc3RQb3MgPSBpICsgMTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGxhc3RQb3MgPiAwKSB7XG4gICAgICBpZiAobGFzdFBvcyAhPT0gcGF0aG5hbWUubGVuZ3RoKSB7XG4gICAgICAgIHBhdGhuYW1lID0gbmV3UGF0aG5hbWUgKyBwYXRobmFtZS5zbGljZShsYXN0UG9zKTtcbiAgICAgIH0gZWxzZSBwYXRobmFtZSA9IG5ld1BhdGhuYW1lO1xuICAgIH1cblxuICAgIC8vIE9ubHkgdGhlIHNsYXNoZWRQcm90b2NvbHMgZ2V0IHRoZSAvLy4gIE5vdCBtYWlsdG86LCB4bXBwOiwgZXRjLlxuICAgIC8vIHVubGVzcyB0aGV5IGhhZCB0aGVtIHRvIGJlZ2luIHdpdGguXG4gICAgaWYgKHRoaXMuc2xhc2hlcyB8fCBzbGFzaGVkUHJvdG9jb2wuaGFzKHByb3RvY29sKSkge1xuICAgICAgaWYgKHRoaXMuc2xhc2hlcyB8fCBob3N0KSB7XG4gICAgICAgIGlmIChwYXRobmFtZSAmJiBwYXRobmFtZS5jaGFyQ29kZUF0KDApICE9PSBDSEFSX0ZPUldBUkRfU0xBU0gpIHtcbiAgICAgICAgICBwYXRobmFtZSA9IFwiL1wiICsgcGF0aG5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgaG9zdCA9IFwiLy9cIiArIGhvc3Q7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICBwcm90b2NvbC5sZW5ndGggPj0gNCAmJlxuICAgICAgICBwcm90b2NvbC5jaGFyQ29kZUF0KDApID09PSAxMDIgLyogZiAqLyAmJlxuICAgICAgICBwcm90b2NvbC5jaGFyQ29kZUF0KDEpID09PSAxMDUgLyogaSAqLyAmJlxuICAgICAgICBwcm90b2NvbC5jaGFyQ29kZUF0KDIpID09PSAxMDggLyogbCAqLyAmJlxuICAgICAgICBwcm90b2NvbC5jaGFyQ29kZUF0KDMpID09PSAxMDEgLyogZSAqL1xuICAgICAgKSB7XG4gICAgICAgIGhvc3QgPSBcIi8vXCI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc2VhcmNoID0gc2VhcmNoLnJlcGxhY2UoLyMvZywgXCIlMjNcIik7XG5cbiAgICBpZiAoaGFzaCAmJiBoYXNoLmNoYXJDb2RlQXQoMCkgIT09IENIQVJfSEFTSCkge1xuICAgICAgaGFzaCA9IFwiI1wiICsgaGFzaDtcbiAgICB9XG4gICAgaWYgKHNlYXJjaCAmJiBzZWFyY2guY2hhckNvZGVBdCgwKSAhPT0gQ0hBUl9RVUVTVElPTl9NQVJLKSB7XG4gICAgICBzZWFyY2ggPSBcIj9cIiArIHNlYXJjaDtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvdG9jb2wgKyBob3N0ICsgcGF0aG5hbWUgKyBzZWFyY2ggKyBoYXNoO1xuICB9XG5cbiAgcHVibGljIHVybFBhcnNlKFxuICAgIHVybDogc3RyaW5nLFxuICAgIHBhcnNlUXVlcnlTdHJpbmc6IGJvb2xlYW4sXG4gICAgc2xhc2hlc0Rlbm90ZUhvc3Q6IGJvb2xlYW4sXG4gICkge1xuICAgIC8vIENvcHkgY2hyb21lLCBJRSwgb3BlcmEgYmFja3NsYXNoLWhhbmRsaW5nIGJlaGF2aW9yLlxuICAgIC8vIEJhY2sgc2xhc2hlcyBiZWZvcmUgdGhlIHF1ZXJ5IHN0cmluZyBnZXQgY29udmVydGVkIHRvIGZvcndhcmQgc2xhc2hlc1xuICAgIC8vIFNlZTogaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTI1OTE2XG4gICAgbGV0IGhhc0hhc2ggPSBmYWxzZTtcbiAgICBsZXQgc3RhcnQgPSAtMTtcbiAgICBsZXQgZW5kID0gLTE7XG4gICAgbGV0IHJlc3QgPSBcIlwiO1xuICAgIGxldCBsYXN0UG9zID0gMDtcbiAgICBmb3IgKGxldCBpID0gMCwgaW5XcyA9IGZhbHNlLCBzcGxpdCA9IGZhbHNlOyBpIDwgdXJsLmxlbmd0aDsgKytpKSB7XG4gICAgICBjb25zdCBjb2RlID0gdXJsLmNoYXJDb2RlQXQoaSk7XG5cbiAgICAgIC8vIEZpbmQgZmlyc3QgYW5kIGxhc3Qgbm9uLXdoaXRlc3BhY2UgY2hhcmFjdGVycyBmb3IgdHJpbW1pbmdcbiAgICAgIGNvbnN0IGlzV3MgPSBjb2RlID09PSBDSEFSX1NQQUNFIHx8XG4gICAgICAgIGNvZGUgPT09IENIQVJfVEFCIHx8XG4gICAgICAgIGNvZGUgPT09IENIQVJfQ0FSUklBR0VfUkVUVVJOIHx8XG4gICAgICAgIGNvZGUgPT09IENIQVJfTElORV9GRUVEIHx8XG4gICAgICAgIGNvZGUgPT09IENIQVJfRk9STV9GRUVEIHx8XG4gICAgICAgIGNvZGUgPT09IENIQVJfTk9fQlJFQUtfU1BBQ0UgfHxcbiAgICAgICAgY29kZSA9PT0gQ0hBUl9aRVJPX1dJRFRIX05PQlJFQUtfU1BBQ0U7XG4gICAgICBpZiAoc3RhcnQgPT09IC0xKSB7XG4gICAgICAgIGlmIChpc1dzKSBjb250aW51ZTtcbiAgICAgICAgbGFzdFBvcyA9IHN0YXJ0ID0gaTtcbiAgICAgIH0gZWxzZSBpZiAoaW5Xcykge1xuICAgICAgICBpZiAoIWlzV3MpIHtcbiAgICAgICAgICBlbmQgPSAtMTtcbiAgICAgICAgICBpbldzID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoaXNXcykge1xuICAgICAgICBlbmQgPSBpO1xuICAgICAgICBpbldzID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gT25seSBjb252ZXJ0IGJhY2tzbGFzaGVzIHdoaWxlIHdlIGhhdmVuJ3Qgc2VlbiBhIHNwbGl0IGNoYXJhY3RlclxuICAgICAgaWYgKCFzcGxpdCkge1xuICAgICAgICBzd2l0Y2ggKGNvZGUpIHtcbiAgICAgICAgICBjYXNlIENIQVJfSEFTSDpcbiAgICAgICAgICAgIGhhc0hhc2ggPSB0cnVlO1xuICAgICAgICAgIC8vIEZhbGwgdGhyb3VnaFxuICAgICAgICAgIGNhc2UgQ0hBUl9RVUVTVElPTl9NQVJLOlxuICAgICAgICAgICAgc3BsaXQgPSB0cnVlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBDSEFSX0JBQ0tXQVJEX1NMQVNIOlxuICAgICAgICAgICAgaWYgKGkgLSBsYXN0UG9zID4gMCkgcmVzdCArPSB1cmwuc2xpY2UobGFzdFBvcywgaSk7XG4gICAgICAgICAgICByZXN0ICs9IFwiL1wiO1xuICAgICAgICAgICAgbGFzdFBvcyA9IGkgKyAxO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoIWhhc0hhc2ggJiYgY29kZSA9PT0gQ0hBUl9IQVNIKSB7XG4gICAgICAgIGhhc0hhc2ggPSB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENoZWNrIGlmIHN0cmluZyB3YXMgbm9uLWVtcHR5IChpbmNsdWRpbmcgc3RyaW5ncyB3aXRoIG9ubHkgd2hpdGVzcGFjZSlcbiAgICBpZiAoc3RhcnQgIT09IC0xKSB7XG4gICAgICBpZiAobGFzdFBvcyA9PT0gc3RhcnQpIHtcbiAgICAgICAgLy8gV2UgZGlkbid0IGNvbnZlcnQgYW55IGJhY2tzbGFzaGVzXG5cbiAgICAgICAgaWYgKGVuZCA9PT0gLTEpIHtcbiAgICAgICAgICBpZiAoc3RhcnQgPT09IDApIHJlc3QgPSB1cmw7XG4gICAgICAgICAgZWxzZSByZXN0ID0gdXJsLnNsaWNlKHN0YXJ0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN0ID0gdXJsLnNsaWNlKHN0YXJ0LCBlbmQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGVuZCA9PT0gLTEgJiYgbGFzdFBvcyA8IHVybC5sZW5ndGgpIHtcbiAgICAgICAgLy8gV2UgY29udmVydGVkIHNvbWUgYmFja3NsYXNoZXMgYW5kIGhhdmUgb25seSBwYXJ0IG9mIHRoZSBlbnRpcmUgc3RyaW5nXG4gICAgICAgIHJlc3QgKz0gdXJsLnNsaWNlKGxhc3RQb3MpO1xuICAgICAgfSBlbHNlIGlmIChlbmQgIT09IC0xICYmIGxhc3RQb3MgPCBlbmQpIHtcbiAgICAgICAgLy8gV2UgY29udmVydGVkIHNvbWUgYmFja3NsYXNoZXMgYW5kIGhhdmUgb25seSBwYXJ0IG9mIHRoZSBlbnRpcmUgc3RyaW5nXG4gICAgICAgIHJlc3QgKz0gdXJsLnNsaWNlKGxhc3RQb3MsIGVuZCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFzbGFzaGVzRGVub3RlSG9zdCAmJiAhaGFzSGFzaCkge1xuICAgICAgLy8gVHJ5IGZhc3QgcGF0aCByZWdleHBcbiAgICAgIGNvbnN0IHNpbXBsZVBhdGggPSBzaW1wbGVQYXRoUGF0dGVybi5leGVjKHJlc3QpO1xuICAgICAgaWYgKHNpbXBsZVBhdGgpIHtcbiAgICAgICAgdGhpcy5wYXRoID0gcmVzdDtcbiAgICAgICAgdGhpcy5ocmVmID0gcmVzdDtcbiAgICAgICAgdGhpcy5wYXRobmFtZSA9IHNpbXBsZVBhdGhbMV07XG4gICAgICAgIGlmIChzaW1wbGVQYXRoWzJdKSB7XG4gICAgICAgICAgdGhpcy5zZWFyY2ggPSBzaW1wbGVQYXRoWzJdO1xuICAgICAgICAgIGlmIChwYXJzZVF1ZXJ5U3RyaW5nKSB7XG4gICAgICAgICAgICBpZiAocXVlcnlzdHJpbmcgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICBxdWVyeXN0cmluZyA9IGltcG9ydChcIi4vcXVlcnlzdHJpbmcudHNcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnF1ZXJ5ID0gcXVlcnlzdHJpbmcucGFyc2UodGhpcy5zZWFyY2guc2xpY2UoMSkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnF1ZXJ5ID0gdGhpcy5zZWFyY2guc2xpY2UoMSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHBhcnNlUXVlcnlTdHJpbmcpIHtcbiAgICAgICAgICB0aGlzLnNlYXJjaCA9IG51bGw7XG4gICAgICAgICAgdGhpcy5xdWVyeSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IHByb3RvOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsIHwgc3RyaW5nID0gcHJvdG9jb2xQYXR0ZXJuLmV4ZWMoXG4gICAgICByZXN0LFxuICAgICk7XG4gICAgbGV0IGxvd2VyUHJvdG8gPSBcIlwiO1xuICAgIGlmIChwcm90bykge1xuICAgICAgcHJvdG8gPSBwcm90b1swXTtcbiAgICAgIGxvd2VyUHJvdG8gPSBwcm90by50b0xvd2VyQ2FzZSgpO1xuICAgICAgdGhpcy5wcm90b2NvbCA9IGxvd2VyUHJvdG87XG4gICAgICByZXN0ID0gcmVzdC5zbGljZShwcm90by5sZW5ndGgpO1xuICAgIH1cblxuICAgIC8vIEZpZ3VyZSBvdXQgaWYgaXQncyBnb3QgYSBob3N0XG4gICAgLy8gdXNlckBzZXJ2ZXIgaXMgKmFsd2F5cyogaW50ZXJwcmV0ZWQgYXMgYSBob3N0bmFtZSwgYW5kIHVybFxuICAgIC8vIHJlc29sdXRpb24gd2lsbCB0cmVhdCAvL2Zvby9iYXIgYXMgaG9zdD1mb28scGF0aD1iYXIgYmVjYXVzZSB0aGF0J3NcbiAgICAvLyBob3cgdGhlIGJyb3dzZXIgcmVzb2x2ZXMgcmVsYXRpdmUgVVJMcy5cbiAgICBsZXQgc2xhc2hlcztcbiAgICBpZiAoc2xhc2hlc0Rlbm90ZUhvc3QgfHwgcHJvdG8gfHwgaG9zdFBhdHRlcm4udGVzdChyZXN0KSkge1xuICAgICAgc2xhc2hlcyA9IHJlc3QuY2hhckNvZGVBdCgwKSA9PT0gQ0hBUl9GT1JXQVJEX1NMQVNIICYmXG4gICAgICAgIHJlc3QuY2hhckNvZGVBdCgxKSA9PT0gQ0hBUl9GT1JXQVJEX1NMQVNIO1xuICAgICAgaWYgKHNsYXNoZXMgJiYgIShwcm90byAmJiBob3N0bGVzc1Byb3RvY29sLmhhcyhsb3dlclByb3RvKSkpIHtcbiAgICAgICAgcmVzdCA9IHJlc3Quc2xpY2UoMik7XG4gICAgICAgIHRoaXMuc2xhc2hlcyA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgIWhvc3RsZXNzUHJvdG9jb2wuaGFzKGxvd2VyUHJvdG8pICYmXG4gICAgICAoc2xhc2hlcyB8fCAocHJvdG8gJiYgIXNsYXNoZWRQcm90b2NvbC5oYXMocHJvdG8pKSlcbiAgICApIHtcbiAgICAgIC8vIHRoZXJlJ3MgYSBob3N0bmFtZS5cbiAgICAgIC8vIHRoZSBmaXJzdCBpbnN0YW5jZSBvZiAvLCA/LCA7LCBvciAjIGVuZHMgdGhlIGhvc3QuXG4gICAgICAvL1xuICAgICAgLy8gSWYgdGhlcmUgaXMgYW4gQCBpbiB0aGUgaG9zdG5hbWUsIHRoZW4gbm9uLWhvc3QgY2hhcnMgKmFyZSogYWxsb3dlZFxuICAgICAgLy8gdG8gdGhlIGxlZnQgb2YgdGhlIGxhc3QgQCBzaWduLCB1bmxlc3Mgc29tZSBob3N0LWVuZGluZyBjaGFyYWN0ZXJcbiAgICAgIC8vIGNvbWVzICpiZWZvcmUqIHRoZSBALXNpZ24uXG4gICAgICAvLyBVUkxzIGFyZSBvYm5veGlvdXMuXG4gICAgICAvL1xuICAgICAgLy8gZXg6XG4gICAgICAvLyBodHRwOi8vYUBiQGMvID0+IHVzZXI6YUBiIGhvc3Q6Y1xuICAgICAgLy8gaHR0cDovL2FAYj9AYyA9PiB1c2VyOmEgaG9zdDpiIHBhdGg6Lz9AY1xuXG4gICAgICBsZXQgaG9zdEVuZCA9IC0xO1xuICAgICAgbGV0IGF0U2lnbiA9IC0xO1xuICAgICAgbGV0IG5vbkhvc3QgPSAtMTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVzdC5sZW5ndGg7ICsraSkge1xuICAgICAgICBzd2l0Y2ggKHJlc3QuY2hhckNvZGVBdChpKSkge1xuICAgICAgICAgIGNhc2UgQ0hBUl9UQUI6XG4gICAgICAgICAgY2FzZSBDSEFSX0xJTkVfRkVFRDpcbiAgICAgICAgICBjYXNlIENIQVJfQ0FSUklBR0VfUkVUVVJOOlxuICAgICAgICAgIGNhc2UgQ0hBUl9TUEFDRTpcbiAgICAgICAgICBjYXNlIENIQVJfRE9VQkxFX1FVT1RFOlxuICAgICAgICAgIGNhc2UgQ0hBUl9QRVJDRU5UOlxuICAgICAgICAgIGNhc2UgQ0hBUl9TSU5HTEVfUVVPVEU6XG4gICAgICAgICAgY2FzZSBDSEFSX1NFTUlDT0xPTjpcbiAgICAgICAgICBjYXNlIENIQVJfTEVGVF9BTkdMRV9CUkFDS0VUOlxuICAgICAgICAgIGNhc2UgQ0hBUl9SSUdIVF9BTkdMRV9CUkFDS0VUOlxuICAgICAgICAgIGNhc2UgQ0hBUl9CQUNLV0FSRF9TTEFTSDpcbiAgICAgICAgICBjYXNlIENIQVJfQ0lSQ1VNRkxFWF9BQ0NFTlQ6XG4gICAgICAgICAgY2FzZSBDSEFSX0dSQVZFX0FDQ0VOVDpcbiAgICAgICAgICBjYXNlIENIQVJfTEVGVF9DVVJMWV9CUkFDS0VUOlxuICAgICAgICAgIGNhc2UgQ0hBUl9WRVJUSUNBTF9MSU5FOlxuICAgICAgICAgIGNhc2UgQ0hBUl9SSUdIVF9DVVJMWV9CUkFDS0VUOlxuICAgICAgICAgICAgLy8gQ2hhcmFjdGVycyB0aGF0IGFyZSBuZXZlciBldmVyIGFsbG93ZWQgaW4gYSBob3N0bmFtZSBmcm9tIFJGQyAyMzk2XG4gICAgICAgICAgICBpZiAobm9uSG9zdCA9PT0gLTEpIG5vbkhvc3QgPSBpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBDSEFSX0hBU0g6XG4gICAgICAgICAgY2FzZSBDSEFSX0ZPUldBUkRfU0xBU0g6XG4gICAgICAgICAgY2FzZSBDSEFSX1FVRVNUSU9OX01BUks6XG4gICAgICAgICAgICAvLyBGaW5kIHRoZSBmaXJzdCBpbnN0YW5jZSBvZiBhbnkgaG9zdC1lbmRpbmcgY2hhcmFjdGVyc1xuICAgICAgICAgICAgaWYgKG5vbkhvc3QgPT09IC0xKSBub25Ib3N0ID0gaTtcbiAgICAgICAgICAgIGhvc3RFbmQgPSBpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBDSEFSX0FUOlxuICAgICAgICAgICAgLy8gQXQgdGhpcyBwb2ludCwgZWl0aGVyIHdlIGhhdmUgYW4gZXhwbGljaXQgcG9pbnQgd2hlcmUgdGhlXG4gICAgICAgICAgICAvLyBhdXRoIHBvcnRpb24gY2Fubm90IGdvIHBhc3QsIG9yIHRoZSBsYXN0IEAgY2hhciBpcyB0aGUgZGVjaWRlci5cbiAgICAgICAgICAgIGF0U2lnbiA9IGk7XG4gICAgICAgICAgICBub25Ib3N0ID0gLTE7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAoaG9zdEVuZCAhPT0gLTEpIGJyZWFrO1xuICAgICAgfVxuICAgICAgc3RhcnQgPSAwO1xuICAgICAgaWYgKGF0U2lnbiAhPT0gLTEpIHtcbiAgICAgICAgdGhpcy5hdXRoID0gZGVjb2RlVVJJQ29tcG9uZW50KHJlc3Quc2xpY2UoMCwgYXRTaWduKSk7XG4gICAgICAgIHN0YXJ0ID0gYXRTaWduICsgMTtcbiAgICAgIH1cbiAgICAgIGlmIChub25Ib3N0ID09PSAtMSkge1xuICAgICAgICB0aGlzLmhvc3QgPSByZXN0LnNsaWNlKHN0YXJ0KTtcbiAgICAgICAgcmVzdCA9IFwiXCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmhvc3QgPSByZXN0LnNsaWNlKHN0YXJ0LCBub25Ib3N0KTtcbiAgICAgICAgcmVzdCA9IHJlc3Quc2xpY2Uobm9uSG9zdCk7XG4gICAgICB9XG5cbiAgICAgIC8vIHB1bGwgb3V0IHBvcnQuXG4gICAgICB0aGlzLnBhcnNlSG9zdCgpO1xuXG4gICAgICAvLyBXZSd2ZSBpbmRpY2F0ZWQgdGhhdCB0aGVyZSBpcyBhIGhvc3RuYW1lLFxuICAgICAgLy8gc28gZXZlbiBpZiBpdCdzIGVtcHR5LCBpdCBoYXMgdG8gYmUgcHJlc2VudC5cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5ob3N0bmFtZSAhPT0gXCJzdHJpbmdcIikgdGhpcy5ob3N0bmFtZSA9IFwiXCI7XG5cbiAgICAgIGNvbnN0IGhvc3RuYW1lID0gdGhpcy5ob3N0bmFtZTtcblxuICAgICAgLy8gSWYgaG9zdG5hbWUgYmVnaW5zIHdpdGggWyBhbmQgZW5kcyB3aXRoIF1cbiAgICAgIC8vIGFzc3VtZSB0aGF0IGl0J3MgYW4gSVB2NiBhZGRyZXNzLlxuICAgICAgY29uc3QgaXB2Nkhvc3RuYW1lID0gaXNJcHY2SG9zdG5hbWUoaG9zdG5hbWUpO1xuXG4gICAgICAvLyB2YWxpZGF0ZSBhIGxpdHRsZS5cbiAgICAgIGlmICghaXB2Nkhvc3RuYW1lKSB7XG4gICAgICAgIHJlc3QgPSBnZXRIb3N0bmFtZSh0aGlzLCByZXN0LCBob3N0bmFtZSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLmhvc3RuYW1lLmxlbmd0aCA+IGhvc3RuYW1lTWF4TGVuKSB7XG4gICAgICAgIHRoaXMuaG9zdG5hbWUgPSBcIlwiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSG9zdG5hbWVzIGFyZSBhbHdheXMgbG93ZXIgY2FzZS5cbiAgICAgICAgdGhpcy5ob3N0bmFtZSA9IHRoaXMuaG9zdG5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFpcHY2SG9zdG5hbWUpIHtcbiAgICAgICAgLy8gSUROQSBTdXBwb3J0OiBSZXR1cm5zIGEgcHVueWNvZGVkIHJlcHJlc2VudGF0aW9uIG9mIFwiZG9tYWluXCIuXG4gICAgICAgIC8vIEl0IG9ubHkgY29udmVydHMgcGFydHMgb2YgdGhlIGRvbWFpbiBuYW1lIHRoYXRcbiAgICAgICAgLy8gaGF2ZSBub24tQVNDSUkgY2hhcmFjdGVycywgaS5lLiBpdCBkb2Vzbid0IG1hdHRlciBpZlxuICAgICAgICAvLyB5b3UgY2FsbCBpdCB3aXRoIGEgZG9tYWluIHRoYXQgYWxyZWFkeSBpcyBBU0NJSS1vbmx5LlxuXG4gICAgICAgIC8vIFVzZSBsZW5pZW50IG1vZGUgKGB0cnVlYCkgdG8gdHJ5IHRvIHN1cHBvcnQgZXZlbiBub24tY29tcGxpYW50XG4gICAgICAgIC8vIFVSTHMuXG4gICAgICAgIHRoaXMuaG9zdG5hbWUgPSB0b0FTQ0lJKHRoaXMuaG9zdG5hbWUpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBwID0gdGhpcy5wb3J0ID8gXCI6XCIgKyB0aGlzLnBvcnQgOiBcIlwiO1xuICAgICAgY29uc3QgaCA9IHRoaXMuaG9zdG5hbWUgfHwgXCJcIjtcbiAgICAgIHRoaXMuaG9zdCA9IGggKyBwO1xuXG4gICAgICAvLyBzdHJpcCBbIGFuZCBdIGZyb20gdGhlIGhvc3RuYW1lXG4gICAgICAvLyB0aGUgaG9zdCBmaWVsZCBzdGlsbCByZXRhaW5zIHRoZW0sIHRob3VnaFxuICAgICAgaWYgKGlwdjZIb3N0bmFtZSkge1xuICAgICAgICB0aGlzLmhvc3RuYW1lID0gdGhpcy5ob3N0bmFtZS5zbGljZSgxLCAtMSk7XG4gICAgICAgIGlmIChyZXN0WzBdICE9PSBcIi9cIikge1xuICAgICAgICAgIHJlc3QgPSBcIi9cIiArIHJlc3Q7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBOb3cgcmVzdCBpcyBzZXQgdG8gdGhlIHBvc3QtaG9zdCBzdHVmZi5cbiAgICAvLyBDaG9wIG9mZiBhbnkgZGVsaW0gY2hhcnMuXG4gICAgaWYgKCF1bnNhZmVQcm90b2NvbC5oYXMobG93ZXJQcm90bykpIHtcbiAgICAgIC8vIEZpcnN0LCBtYWtlIDEwMCUgc3VyZSB0aGF0IGFueSBcImF1dG9Fc2NhcGVcIiBjaGFycyBnZXRcbiAgICAgIC8vIGVzY2FwZWQsIGV2ZW4gaWYgZW5jb2RlVVJJQ29tcG9uZW50IGRvZXNuJ3QgdGhpbmsgdGhleVxuICAgICAgLy8gbmVlZCB0byBiZS5cbiAgICAgIHJlc3QgPSBhdXRvRXNjYXBlU3RyKHJlc3QpO1xuICAgIH1cblxuICAgIGxldCBxdWVzdGlvbklkeCA9IC0xO1xuICAgIGxldCBoYXNoSWR4ID0gLTE7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZXN0Lmxlbmd0aDsgKytpKSB7XG4gICAgICBjb25zdCBjb2RlID0gcmVzdC5jaGFyQ29kZUF0KGkpO1xuICAgICAgaWYgKGNvZGUgPT09IENIQVJfSEFTSCkge1xuICAgICAgICB0aGlzLmhhc2ggPSByZXN0LnNsaWNlKGkpO1xuICAgICAgICBoYXNoSWR4ID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9IGVsc2UgaWYgKGNvZGUgPT09IENIQVJfUVVFU1RJT05fTUFSSyAmJiBxdWVzdGlvbklkeCA9PT0gLTEpIHtcbiAgICAgICAgcXVlc3Rpb25JZHggPSBpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChxdWVzdGlvbklkeCAhPT0gLTEpIHtcbiAgICAgIGlmIChoYXNoSWR4ID09PSAtMSkge1xuICAgICAgICB0aGlzLnNlYXJjaCA9IHJlc3Quc2xpY2UocXVlc3Rpb25JZHgpO1xuICAgICAgICB0aGlzLnF1ZXJ5ID0gcmVzdC5zbGljZShxdWVzdGlvbklkeCArIDEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zZWFyY2ggPSByZXN0LnNsaWNlKHF1ZXN0aW9uSWR4LCBoYXNoSWR4KTtcbiAgICAgICAgdGhpcy5xdWVyeSA9IHJlc3Quc2xpY2UocXVlc3Rpb25JZHggKyAxLCBoYXNoSWR4KTtcbiAgICAgIH1cbiAgICAgIGlmIChwYXJzZVF1ZXJ5U3RyaW5nKSB7XG4gICAgICAgIGlmIChxdWVyeXN0cmluZyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgcXVlcnlzdHJpbmcgPSBpbXBvcnQoXCIuL3F1ZXJ5c3RyaW5nLnRzXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucXVlcnkgPSBxdWVyeXN0cmluZy5wYXJzZSh0aGlzLnF1ZXJ5KTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHBhcnNlUXVlcnlTdHJpbmcpIHtcbiAgICAgIC8vIE5vIHF1ZXJ5IHN0cmluZywgYnV0IHBhcnNlUXVlcnlTdHJpbmcgc3RpbGwgcmVxdWVzdGVkXG4gICAgICB0aGlzLnNlYXJjaCA9IG51bGw7XG4gICAgICB0aGlzLnF1ZXJ5ID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB9XG5cbiAgICBjb25zdCB1c2VRdWVzdGlvbklkeCA9IHF1ZXN0aW9uSWR4ICE9PSAtMSAmJlxuICAgICAgKGhhc2hJZHggPT09IC0xIHx8IHF1ZXN0aW9uSWR4IDwgaGFzaElkeCk7XG4gICAgY29uc3QgZmlyc3RJZHggPSB1c2VRdWVzdGlvbklkeCA/IHF1ZXN0aW9uSWR4IDogaGFzaElkeDtcbiAgICBpZiAoZmlyc3RJZHggPT09IC0xKSB7XG4gICAgICBpZiAocmVzdC5sZW5ndGggPiAwKSB0aGlzLnBhdGhuYW1lID0gcmVzdDtcbiAgICB9IGVsc2UgaWYgKGZpcnN0SWR4ID4gMCkge1xuICAgICAgdGhpcy5wYXRobmFtZSA9IHJlc3Quc2xpY2UoMCwgZmlyc3RJZHgpO1xuICAgIH1cbiAgICBpZiAoXG4gICAgICBzbGFzaGVkUHJvdG9jb2wuaGFzKGxvd2VyUHJvdG8pICYmXG4gICAgICB0aGlzLmhvc3RuYW1lICYmXG4gICAgICAhdGhpcy5wYXRobmFtZVxuICAgICkge1xuICAgICAgdGhpcy5wYXRobmFtZSA9IFwiL1wiO1xuICAgIH1cblxuICAgIC8vIFRvIHN1cHBvcnQgaHR0cC5yZXF1ZXN0XG4gICAgaWYgKHRoaXMucGF0aG5hbWUgfHwgdGhpcy5zZWFyY2gpIHtcbiAgICAgIGNvbnN0IHAgPSB0aGlzLnBhdGhuYW1lIHx8IFwiXCI7XG4gICAgICBjb25zdCBzID0gdGhpcy5zZWFyY2ggfHwgXCJcIjtcbiAgICAgIHRoaXMucGF0aCA9IHAgKyBzO1xuICAgIH1cblxuICAgIC8vIEZpbmFsbHksIHJlY29uc3RydWN0IHRoZSBocmVmIGJhc2VkIG9uIHdoYXQgaGFzIGJlZW4gdmFsaWRhdGVkLlxuICAgIHRoaXMuaHJlZiA9IHRoaXMuZm9ybWF0KCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cblxuLyoqXG4gKiBUaGUgVVJMIG9iamVjdCBoYXMgYm90aCBhIGB0b1N0cmluZygpYCBtZXRob2QgYW5kIGBocmVmYCBwcm9wZXJ0eSB0aGF0IHJldHVybiBzdHJpbmcgc2VyaWFsaXphdGlvbnMgb2YgdGhlIFVSTC5cbiAqIFRoZXNlIGFyZSBub3QsIGhvd2V2ZXIsIGN1c3RvbWl6YWJsZSBpbiBhbnkgd2F5LlxuICogVGhpcyBtZXRob2QgYWxsb3dzIGZvciBiYXNpYyBjdXN0b21pemF0aW9uIG9mIHRoZSBvdXRwdXQuXG4gKiBAc2VlIFRlc3RlZCBpbiBgcGFyYWxsZWwvdGVzdC11cmwtZm9ybWF0LXdoYXR3Zy5qc2AuXG4gKiBAcGFyYW0gdXJsT2JqZWN0XG4gKiBAcGFyYW0gb3B0aW9uc1xuICogQHBhcmFtIG9wdGlvbnMuYXV0aCBgdHJ1ZWAgaWYgdGhlIHNlcmlhbGl6ZWQgVVJMIHN0cmluZyBzaG91bGQgaW5jbHVkZSB0aGUgdXNlcm5hbWUgYW5kIHBhc3N3b3JkLCBgZmFsc2VgIG90aGVyd2lzZS4gKipEZWZhdWx0Kio6IGB0cnVlYC5cbiAqIEBwYXJhbSBvcHRpb25zLmZyYWdtZW50IGB0cnVlYCBpZiB0aGUgc2VyaWFsaXplZCBVUkwgc3RyaW5nIHNob3VsZCBpbmNsdWRlIHRoZSBmcmFnbWVudCwgYGZhbHNlYCBvdGhlcndpc2UuICoqRGVmYXVsdCoqOiBgdHJ1ZWAuXG4gKiBAcGFyYW0gb3B0aW9ucy5zZWFyY2ggYHRydWVgIGlmIHRoZSBzZXJpYWxpemVkIFVSTCBzdHJpbmcgc2hvdWxkIGluY2x1ZGUgdGhlIHNlYXJjaCBxdWVyeSwgKipEZWZhdWx0Kio6IGB0cnVlYC5cbiAqIEBwYXJhbSBvcHRpb25zLnVuaWNvZGUgYHRydWVgIGlmIFVuaWNvZGUgY2hhcmFjdGVycyBhcHBlYXJpbmcgaW4gdGhlIGhvc3QgY29tcG9uZW50IG9mIHRoZSBVUkwgc3RyaW5nIHNob3VsZCBiZSBlbmNvZGVkIGRpcmVjdGx5IGFzIG9wcG9zZWQgdG8gYmVpbmcgUHVueWNvZGUgZW5jb2RlZC4gKipEZWZhdWx0Kio6IGBmYWxzZWAuXG4gKiBAcmV0dXJucyBhIGN1c3RvbWl6YWJsZSBzZXJpYWxpemF0aW9uIG9mIGEgVVJMIGBTdHJpbmdgIHJlcHJlc2VudGF0aW9uIG9mIGEgYFdIQVRXRyBVUkxgIG9iamVjdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdChcbiAgdXJsT2JqZWN0OiBVUkwsXG4gIG9wdGlvbnM/OiB7XG4gICAgYXV0aDogYm9vbGVhbjtcbiAgICBmcmFnbWVudDogYm9vbGVhbjtcbiAgICBzZWFyY2g6IGJvb2xlYW47XG4gICAgdW5pY29kZTogYm9vbGVhbjtcbiAgfSxcbik6IHN0cmluZyB7XG4gIGlmIChvcHRpb25zKSB7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICB0aHJvdyBuZXcgRVJSX0lOVkFMSURfQVJHX1RZUEUoXCJvcHRpb25zXCIsIFwib2JqZWN0XCIsIG9wdGlvbnMpO1xuICAgIH1cbiAgfVxuXG4gIG9wdGlvbnMgPSB7XG4gICAgYXV0aDogdHJ1ZSxcbiAgICBmcmFnbWVudDogdHJ1ZSxcbiAgICBzZWFyY2g6IHRydWUsXG4gICAgdW5pY29kZTogZmFsc2UsXG4gICAgLi4ub3B0aW9ucyxcbiAgfTtcblxuICBsZXQgcmV0ID0gdXJsT2JqZWN0LnByb3RvY29sO1xuICBpZiAodXJsT2JqZWN0Lmhvc3QgIT09IG51bGwpIHtcbiAgICByZXQgKz0gXCIvL1wiO1xuICAgIGNvbnN0IGhhc1VzZXJuYW1lID0gISF1cmxPYmplY3QudXNlcm5hbWU7XG4gICAgY29uc3QgaGFzUGFzc3dvcmQgPSAhIXVybE9iamVjdC5wYXNzd29yZDtcbiAgICBpZiAob3B0aW9ucy5hdXRoICYmIChoYXNVc2VybmFtZSB8fCBoYXNQYXNzd29yZCkpIHtcbiAgICAgIGlmIChoYXNVc2VybmFtZSkge1xuICAgICAgICByZXQgKz0gdXJsT2JqZWN0LnVzZXJuYW1lO1xuICAgICAgfVxuICAgICAgaWYgKGhhc1Bhc3N3b3JkKSB7XG4gICAgICAgIHJldCArPSBgOiR7dXJsT2JqZWN0LnBhc3N3b3JkfWA7XG4gICAgICB9XG4gICAgICByZXQgKz0gXCJAXCI7XG4gICAgfVxuICAgIC8vIFRPRE8od2FmdXdmdTEzKTogU3VwcG9ydCB1bmljb2RlIG9wdGlvblxuICAgIC8vIHJldCArPSBvcHRpb25zLnVuaWNvZGUgP1xuICAgIC8vICAgZG9tYWluVG9Vbmljb2RlKHVybE9iamVjdC5ob3N0KSA6IHVybE9iamVjdC5ob3N0O1xuICAgIHJldCArPSB1cmxPYmplY3QuaG9zdDtcbiAgICBpZiAodXJsT2JqZWN0LnBvcnQpIHtcbiAgICAgIHJldCArPSBgOiR7dXJsT2JqZWN0LnBvcnR9YDtcbiAgICB9XG4gIH1cblxuICByZXQgKz0gdXJsT2JqZWN0LnBhdGhuYW1lO1xuXG4gIGlmIChvcHRpb25zLnNlYXJjaCAmJiB1cmxPYmplY3Quc2VhcmNoKSB7XG4gICAgcmV0ICs9IHVybE9iamVjdC5zZWFyY2g7XG4gIH1cbiAgaWYgKG9wdGlvbnMuZnJhZ21lbnQgJiYgdXJsT2JqZWN0Lmhhc2gpIHtcbiAgICByZXQgKz0gdXJsT2JqZWN0Lmhhc2g7XG4gIH1cblxuICByZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBpc0lwdjZIb3N0bmFtZShob3N0bmFtZTogc3RyaW5nKSB7XG4gIHJldHVybiAoXG4gICAgaG9zdG5hbWUuY2hhckNvZGVBdCgwKSA9PT0gQ0hBUl9MRUZUX1NRVUFSRV9CUkFDS0VUICYmXG4gICAgaG9zdG5hbWUuY2hhckNvZGVBdChob3N0bmFtZS5sZW5ndGggLSAxKSA9PT0gQ0hBUl9SSUdIVF9TUVVBUkVfQlJBQ0tFVFxuICApO1xufVxuXG5mdW5jdGlvbiBnZXRIb3N0bmFtZShzZWxmOiBVcmwsIHJlc3Q6IHN0cmluZywgaG9zdG5hbWU6IHN0cmluZykge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGhvc3RuYW1lLmxlbmd0aDsgKytpKSB7XG4gICAgY29uc3QgY29kZSA9IGhvc3RuYW1lLmNoYXJDb2RlQXQoaSk7XG4gICAgY29uc3QgaXNWYWxpZCA9IChjb2RlID49IENIQVJfTE9XRVJDQVNFX0EgJiYgY29kZSA8PSBDSEFSX0xPV0VSQ0FTRV9aKSB8fFxuICAgICAgY29kZSA9PT0gQ0hBUl9ET1QgfHxcbiAgICAgIChjb2RlID49IENIQVJfVVBQRVJDQVNFX0EgJiYgY29kZSA8PSBDSEFSX1VQUEVSQ0FTRV9aKSB8fFxuICAgICAgKGNvZGUgPj0gQ0hBUl8wICYmIGNvZGUgPD0gQ0hBUl85KSB8fFxuICAgICAgY29kZSA9PT0gQ0hBUl9IWVBIRU5fTUlOVVMgfHxcbiAgICAgIGNvZGUgPT09IENIQVJfUExVUyB8fFxuICAgICAgY29kZSA9PT0gQ0hBUl9VTkRFUlNDT1JFIHx8XG4gICAgICBjb2RlID4gMTI3O1xuXG4gICAgLy8gSW52YWxpZCBob3N0IGNoYXJhY3RlclxuICAgIGlmICghaXNWYWxpZCkge1xuICAgICAgc2VsZi5ob3N0bmFtZSA9IGhvc3RuYW1lLnNsaWNlKDAsIGkpO1xuICAgICAgcmV0dXJuIGAvJHtob3N0bmFtZS5zbGljZShpKX0ke3Jlc3R9YDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3Q7XG59XG5cbi8vIEVzY2FwZWQgY2hhcmFjdGVycy4gVXNlIGVtcHR5IHN0cmluZ3MgdG8gZmlsbCB1cCB1bnVzZWQgZW50cmllcy5cbi8vIFVzaW5nIEFycmF5IGlzIGZhc3RlciB0aGFuIE9iamVjdC9NYXBcbi8vIGRlbm8tZm10LWlnbm9yZVxuY29uc3QgZXNjYXBlZENvZGVzID0gW1xuICAvKiAwIC0gOSAqLyAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJTA5JyxcbiAgLyogMTAgLSAxOSAqLyAnJTBBJywgJycsICcnLCAnJTBEJywgJycsICcnLCAnJywgJycsICcnLCAnJyxcbiAgLyogMjAgLSAyOSAqLyAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJyxcbiAgLyogMzAgLSAzOSAqLyAnJywgJycsICclMjAnLCAnJywgJyUyMicsICcnLCAnJywgJycsICcnLCAnJTI3JyxcbiAgLyogNDAgLSA0OSAqLyAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJyxcbiAgLyogNTAgLSA1OSAqLyAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJyxcbiAgLyogNjAgLSA2OSAqLyAnJTNDJywgJycsICclM0UnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJyxcbiAgLyogNzAgLSA3OSAqLyAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJyxcbiAgLyogODAgLSA4OSAqLyAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJyxcbiAgLyogOTAgLSA5OSAqLyAnJywgJycsICclNUMnLCAnJywgJyU1RScsICcnLCAnJTYwJywgJycsICcnLCAnJyxcbiAgLyogMTAwIC0gMTA5ICovICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLFxuICAvKiAxMTAgLSAxMTkgKi8gJycsICcnLCAnJywgJycsICcnLCAnJywgJycsICcnLCAnJywgJycsXG4gIC8qIDEyMCAtIDEyNSAqLyAnJywgJycsICcnLCAnJTdCJywgJyU3QycsICclN0QnLFxuXTtcblxuLy8gQXV0b21hdGljYWxseSBlc2NhcGUgYWxsIGRlbGltaXRlcnMgYW5kIHVud2lzZSBjaGFyYWN0ZXJzIGZyb20gUkZDIDIzOTYuXG4vLyBBbHNvIGVzY2FwZSBzaW5nbGUgcXVvdGVzIGluIGNhc2Ugb2YgYW4gWFNTIGF0dGFjay5cbi8vIFJldHVybiB0aGUgZXNjYXBlZCBzdHJpbmcuXG5mdW5jdGlvbiBhdXRvRXNjYXBlU3RyKHJlc3Q6IHN0cmluZykge1xuICBsZXQgZXNjYXBlZCA9IFwiXCI7XG4gIGxldCBsYXN0RXNjYXBlZFBvcyA9IDA7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcmVzdC5sZW5ndGg7ICsraSkge1xuICAgIC8vIGBlc2NhcGVkYCBjb250YWlucyBzdWJzdHJpbmcgdXAgdG8gdGhlIGxhc3QgZXNjYXBlZCBjaGFyYWN0ZXIuXG4gICAgY29uc3QgZXNjYXBlZENoYXIgPSBlc2NhcGVkQ29kZXNbcmVzdC5jaGFyQ29kZUF0KGkpXTtcbiAgICBpZiAoZXNjYXBlZENoYXIpIHtcbiAgICAgIC8vIENvbmNhdCBpZiB0aGVyZSBhcmUgb3JkaW5hcnkgY2hhcmFjdGVycyBpbiB0aGUgbWlkZGxlLlxuICAgICAgaWYgKGkgPiBsYXN0RXNjYXBlZFBvcykge1xuICAgICAgICBlc2NhcGVkICs9IHJlc3Quc2xpY2UobGFzdEVzY2FwZWRQb3MsIGkpO1xuICAgICAgfVxuICAgICAgZXNjYXBlZCArPSBlc2NhcGVkQ2hhcjtcbiAgICAgIGxhc3RFc2NhcGVkUG9zID0gaSArIDE7XG4gICAgfVxuICB9XG4gIGlmIChsYXN0RXNjYXBlZFBvcyA9PT0gMCkge1xuICAgIC8vIE5vdGhpbmcgaGFzIGJlZW4gZXNjYXBlZC5cbiAgICByZXR1cm4gcmVzdDtcbiAgfVxuXG4gIC8vIFRoZXJlIGFyZSBvcmRpbmFyeSBjaGFyYWN0ZXJzIGF0IHRoZSBlbmQuXG4gIGlmIChsYXN0RXNjYXBlZFBvcyA8IHJlc3QubGVuZ3RoKSB7XG4gICAgZXNjYXBlZCArPSByZXN0LnNsaWNlKGxhc3RFc2NhcGVkUG9zKTtcbiAgfVxuXG4gIHJldHVybiBlc2NhcGVkO1xufVxuXG4vKipcbiAqIFRoZSB1cmwudXJsUGFyc2UoKSBtZXRob2QgdGFrZXMgYSBVUkwgc3RyaW5nLCBwYXJzZXMgaXQsIGFuZCByZXR1cm5zIGEgVVJMIG9iamVjdC5cbiAqXG4gKiBAc2VlIFRlc3RlZCBpbiBgcGFyYWxsZWwvdGVzdC11cmwtcGFyc2UtZm9ybWF0LmpzYC5cbiAqIEBwYXJhbSB1cmwgVGhlIFVSTCBzdHJpbmcgdG8gcGFyc2UuXG4gKiBAcGFyYW0gcGFyc2VRdWVyeVN0cmluZyBJZiBgdHJ1ZWAsIHRoZSBxdWVyeSBwcm9wZXJ0eSB3aWxsIGFsd2F5cyBiZSBzZXQgdG8gYW4gb2JqZWN0IHJldHVybmVkIGJ5IHRoZSBxdWVyeXN0cmluZyBtb2R1bGUncyBwYXJzZSgpIG1ldGhvZC4gSWYgZmFsc2UsXG4gKiB0aGUgcXVlcnkgcHJvcGVydHkgb24gdGhlIHJldHVybmVkIFVSTCBvYmplY3Qgd2lsbCBiZSBhbiB1bnBhcnNlZCwgdW5kZWNvZGVkIHN0cmluZy4gRGVmYXVsdDogZmFsc2UuXG4gKiBAcGFyYW0gc2xhc2hlc0Rlbm90ZUhvc3QgSWYgYHRydWVgLCB0aGUgZmlyc3QgdG9rZW4gYWZ0ZXIgdGhlIGxpdGVyYWwgc3RyaW5nIC8vIGFuZCBwcmVjZWRpbmcgdGhlIG5leHQgLyB3aWxsIGJlIGludGVycHJldGVkIGFzIHRoZSBob3N0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZShcbiAgdXJsOiBzdHJpbmcgfCBVcmwsXG4gIHBhcnNlUXVlcnlTdHJpbmc6IGJvb2xlYW4sXG4gIHNsYXNoZXNEZW5vdGVIb3N0OiBib29sZWFuLFxuKSB7XG4gIGlmICh1cmwgaW5zdGFuY2VvZiBVcmwpIHJldHVybiB1cmw7XG5cbiAgY29uc3QgdXJsT2JqZWN0ID0gbmV3IFVybCgpO1xuICB1cmxPYmplY3QudXJsUGFyc2UodXJsLCBwYXJzZVF1ZXJ5U3RyaW5nLCBzbGFzaGVzRGVub3RlSG9zdCk7XG4gIHJldHVybiB1cmxPYmplY3Q7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlT2JqZWN0KHNvdXJjZTogc3RyaW5nIHwgVXJsLCByZWxhdGl2ZTogc3RyaW5nKSB7XG4gIGlmICghc291cmNlKSByZXR1cm4gcmVsYXRpdmU7XG4gIHJldHVybiBwYXJzZShzb3VyY2UsIGZhbHNlLCB0cnVlKS5yZXNvbHZlT2JqZWN0KHJlbGF0aXZlKTtcbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIGVuc3VyZXMgdGhlIGNvcnJlY3QgZGVjb2RpbmdzIG9mIHBlcmNlbnQtZW5jb2RlZCBjaGFyYWN0ZXJzIGFzIHdlbGwgYXMgZW5zdXJpbmcgYSBjcm9zcy1wbGF0Zm9ybSB2YWxpZCBhYnNvbHV0ZSBwYXRoIHN0cmluZy5cbiAqIEBzZWUgVGVzdGVkIGluIGBwYXJhbGxlbC90ZXN0LWZpbGV1cmx0b3BhdGguanNgLlxuICogQHBhcmFtIHBhdGggVGhlIGZpbGUgVVJMIHN0cmluZyBvciBVUkwgb2JqZWN0IHRvIGNvbnZlcnQgdG8gYSBwYXRoLlxuICogQHJldHVybnMgVGhlIGZ1bGx5LXJlc29sdmVkIHBsYXRmb3JtLXNwZWNpZmljIE5vZGUuanMgZmlsZSBwYXRoLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmlsZVVSTFRvUGF0aChwYXRoOiBzdHJpbmcgfCBVUkwpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIHBhdGggPT09IFwic3RyaW5nXCIpIHBhdGggPSBuZXcgVVJMKHBhdGgpO1xuICBlbHNlIGlmICghKHBhdGggaW5zdGFuY2VvZiBVUkwpKSB7XG4gICAgdGhyb3cgbmV3IEVSUl9JTlZBTElEX0FSR19UWVBFKFwicGF0aFwiLCBbXCJzdHJpbmdcIiwgXCJVUkxcIl0sIHBhdGgpO1xuICB9XG4gIGlmIChwYXRoLnByb3RvY29sICE9PSBcImZpbGU6XCIpIHtcbiAgICB0aHJvdyBuZXcgRVJSX0lOVkFMSURfVVJMX1NDSEVNRShcImZpbGVcIik7XG4gIH1cbiAgcmV0dXJuIGlzV2luZG93cyA/IGdldFBhdGhGcm9tVVJMV2luKHBhdGgpIDogZ2V0UGF0aEZyb21VUkxQb3NpeChwYXRoKTtcbn1cblxuZnVuY3Rpb24gZ2V0UGF0aEZyb21VUkxXaW4odXJsOiBVUkwpOiBzdHJpbmcge1xuICBjb25zdCBob3N0bmFtZSA9IHVybC5ob3N0bmFtZTtcbiAgbGV0IHBhdGhuYW1lID0gdXJsLnBhdGhuYW1lO1xuICBmb3IgKGxldCBuID0gMDsgbiA8IHBhdGhuYW1lLmxlbmd0aDsgbisrKSB7XG4gICAgaWYgKHBhdGhuYW1lW25dID09PSBcIiVcIikge1xuICAgICAgY29uc3QgdGhpcmQgPSBwYXRobmFtZS5jb2RlUG9pbnRBdChuICsgMikhIHwgMHgyMDtcbiAgICAgIGlmIChcbiAgICAgICAgKHBhdGhuYW1lW24gKyAxXSA9PT0gXCIyXCIgJiYgdGhpcmQgPT09IDEwMikgfHwgLy8gMmYgMkYgL1xuICAgICAgICAocGF0aG5hbWVbbiArIDFdID09PSBcIjVcIiAmJiB0aGlyZCA9PT0gOTkpIC8vIDVjIDVDIFxcXG4gICAgICApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVSUl9JTlZBTElEX0ZJTEVfVVJMX1BBVEgoXG4gICAgICAgICAgXCJtdXN0IG5vdCBpbmNsdWRlIGVuY29kZWQgXFxcXCBvciAvIGNoYXJhY3RlcnNcIixcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwYXRobmFtZSA9IHBhdGhuYW1lLnJlcGxhY2UoZm9yd2FyZFNsYXNoUmVnRXgsIFwiXFxcXFwiKTtcbiAgcGF0aG5hbWUgPSBkZWNvZGVVUklDb21wb25lbnQocGF0aG5hbWUpO1xuICBpZiAoaG9zdG5hbWUgIT09IFwiXCIpIHtcbiAgICAvLyBUT0RPKGJhcnRsb21pZWp1KTogYWRkIHN1cHBvcnQgZm9yIHB1bnljb2RlIGVuY29kaW5nc1xuICAgIHJldHVybiBgXFxcXFxcXFwke2hvc3RuYW1lfSR7cGF0aG5hbWV9YDtcbiAgfSBlbHNlIHtcbiAgICAvLyBPdGhlcndpc2UsIGl0J3MgYSBsb2NhbCBwYXRoIHRoYXQgcmVxdWlyZXMgYSBkcml2ZSBsZXR0ZXJcbiAgICBjb25zdCBsZXR0ZXIgPSBwYXRobmFtZS5jb2RlUG9pbnRBdCgxKSEgfCAweDIwO1xuICAgIGNvbnN0IHNlcCA9IHBhdGhuYW1lWzJdO1xuICAgIGlmIChcbiAgICAgIGxldHRlciA8IENIQVJfTE9XRVJDQVNFX0EgfHxcbiAgICAgIGxldHRlciA+IENIQVJfTE9XRVJDQVNFX1ogfHwgLy8gYS4ueiBBLi5aXG4gICAgICBzZXAgIT09IFwiOlwiXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgRVJSX0lOVkFMSURfRklMRV9VUkxfUEFUSChcIm11c3QgYmUgYWJzb2x1dGVcIik7XG4gICAgfVxuICAgIHJldHVybiBwYXRobmFtZS5zbGljZSgxKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRQYXRoRnJvbVVSTFBvc2l4KHVybDogVVJMKTogc3RyaW5nIHtcbiAgaWYgKHVybC5ob3N0bmFtZSAhPT0gXCJcIikge1xuICAgIHRocm93IG5ldyBFUlJfSU5WQUxJRF9GSUxFX1VSTF9IT1NUKG9zVHlwZSk7XG4gIH1cbiAgY29uc3QgcGF0aG5hbWUgPSB1cmwucGF0aG5hbWU7XG4gIGZvciAobGV0IG4gPSAwOyBuIDwgcGF0aG5hbWUubGVuZ3RoOyBuKyspIHtcbiAgICBpZiAocGF0aG5hbWVbbl0gPT09IFwiJVwiKSB7XG4gICAgICBjb25zdCB0aGlyZCA9IHBhdGhuYW1lLmNvZGVQb2ludEF0KG4gKyAyKSEgfCAweDIwO1xuICAgICAgaWYgKHBhdGhuYW1lW24gKyAxXSA9PT0gXCIyXCIgJiYgdGhpcmQgPT09IDEwMikge1xuICAgICAgICB0aHJvdyBuZXcgRVJSX0lOVkFMSURfRklMRV9VUkxfUEFUSChcbiAgICAgICAgICBcIm11c3Qgbm90IGluY2x1ZGUgZW5jb2RlZCAvIGNoYXJhY3RlcnNcIixcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChwYXRobmFtZSk7XG59XG5cbi8qKlxuICogIFRoZSBmb2xsb3dpbmcgY2hhcmFjdGVycyBhcmUgcGVyY2VudC1lbmNvZGVkIHdoZW4gY29udmVydGluZyBmcm9tIGZpbGUgcGF0aFxuICogIHRvIFVSTDpcbiAqICAtICU6IFRoZSBwZXJjZW50IGNoYXJhY3RlciBpcyB0aGUgb25seSBjaGFyYWN0ZXIgbm90IGVuY29kZWQgYnkgdGhlXG4gKiAgICAgICBgcGF0aG5hbWVgIHNldHRlci5cbiAqICAtIFxcOiBCYWNrc2xhc2ggaXMgZW5jb2RlZCBvbiBub24td2luZG93cyBwbGF0Zm9ybXMgc2luY2UgaXQncyBhIHZhbGlkXG4gKiAgICAgICBjaGFyYWN0ZXIgYnV0IHRoZSBgcGF0aG5hbWVgIHNldHRlcnMgcmVwbGFjZXMgaXQgYnkgYSBmb3J3YXJkIHNsYXNoLlxuICogIC0gTEY6IFRoZSBuZXdsaW5lIGNoYXJhY3RlciBpcyBzdHJpcHBlZCBvdXQgYnkgdGhlIGBwYXRobmFtZWAgc2V0dGVyLlxuICogICAgICAgIChTZWUgd2hhdHdnL3VybCM0MTkpXG4gKiAgLSBDUjogVGhlIGNhcnJpYWdlIHJldHVybiBjaGFyYWN0ZXIgaXMgYWxzbyBzdHJpcHBlZCBvdXQgYnkgdGhlIGBwYXRobmFtZWBcbiAqICAgICAgICBzZXR0ZXIuXG4gKiAgLSBUQUI6IFRoZSB0YWIgY2hhcmFjdGVyIGlzIGFsc28gc3RyaXBwZWQgb3V0IGJ5IHRoZSBgcGF0aG5hbWVgIHNldHRlci5cbiAqL1xuZnVuY3Rpb24gZW5jb2RlUGF0aENoYXJzKGZpbGVwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoZmlsZXBhdGguaW5jbHVkZXMoXCIlXCIpKSB7XG4gICAgZmlsZXBhdGggPSBmaWxlcGF0aC5yZXBsYWNlKHBlcmNlbnRSZWdFeCwgXCIlMjVcIik7XG4gIH1cbiAgLy8gSW4gcG9zaXgsIGJhY2tzbGFzaCBpcyBhIHZhbGlkIGNoYXJhY3RlciBpbiBwYXRoczpcbiAgaWYgKCFpc1dpbmRvd3MgJiYgZmlsZXBhdGguaW5jbHVkZXMoXCJcXFxcXCIpKSB7XG4gICAgZmlsZXBhdGggPSBmaWxlcGF0aC5yZXBsYWNlKGJhY2tzbGFzaFJlZ0V4LCBcIiU1Q1wiKTtcbiAgfVxuICBpZiAoZmlsZXBhdGguaW5jbHVkZXMoXCJcXG5cIikpIHtcbiAgICBmaWxlcGF0aCA9IGZpbGVwYXRoLnJlcGxhY2UobmV3bGluZVJlZ0V4LCBcIiUwQVwiKTtcbiAgfVxuICBpZiAoZmlsZXBhdGguaW5jbHVkZXMoXCJcXHJcIikpIHtcbiAgICBmaWxlcGF0aCA9IGZpbGVwYXRoLnJlcGxhY2UoY2FycmlhZ2VSZXR1cm5SZWdFeCwgXCIlMERcIik7XG4gIH1cbiAgaWYgKGZpbGVwYXRoLmluY2x1ZGVzKFwiXFx0XCIpKSB7XG4gICAgZmlsZXBhdGggPSBmaWxlcGF0aC5yZXBsYWNlKHRhYlJlZ0V4LCBcIiUwOVwiKTtcbiAgfVxuICByZXR1cm4gZmlsZXBhdGg7XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBlbnN1cmVzIHRoYXQgYGZpbGVwYXRoYCBpcyByZXNvbHZlZCBhYnNvbHV0ZWx5LCBhbmQgdGhhdCB0aGUgVVJMIGNvbnRyb2wgY2hhcmFjdGVycyBhcmUgY29ycmVjdGx5IGVuY29kZWQgd2hlbiBjb252ZXJ0aW5nIGludG8gYSBGaWxlIFVSTC5cbiAqIEBzZWUgVGVzdGVkIGluIGBwYXJhbGxlbC90ZXN0LXVybC1wYXRodG9maWxldXJsLmpzYC5cbiAqIEBwYXJhbSBmaWxlcGF0aCBUaGUgZmlsZSBwYXRoIHN0cmluZyB0byBjb252ZXJ0IHRvIGEgZmlsZSBVUkwuXG4gKiBAcmV0dXJucyBUaGUgZmlsZSBVUkwgb2JqZWN0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGF0aFRvRmlsZVVSTChmaWxlcGF0aDogc3RyaW5nKTogVVJMIHtcbiAgY29uc3Qgb3V0VVJMID0gbmV3IFVSTChcImZpbGU6Ly9cIik7XG4gIGlmIChpc1dpbmRvd3MgJiYgZmlsZXBhdGguc3RhcnRzV2l0aChcIlxcXFxcXFxcXCIpKSB7XG4gICAgLy8gVU5DIHBhdGggZm9ybWF0OiBcXFxcc2VydmVyXFxzaGFyZVxccmVzb3VyY2VcbiAgICBjb25zdCBwYXRocyA9IGZpbGVwYXRoLnNwbGl0KFwiXFxcXFwiKTtcbiAgICBpZiAocGF0aHMubGVuZ3RoIDw9IDMpIHtcbiAgICAgIHRocm93IG5ldyBFUlJfSU5WQUxJRF9BUkdfVkFMVUUoXG4gICAgICAgIFwiZmlsZXBhdGhcIixcbiAgICAgICAgZmlsZXBhdGgsXG4gICAgICAgIFwiTWlzc2luZyBVTkMgcmVzb3VyY2UgcGF0aFwiLFxuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3QgaG9zdG5hbWUgPSBwYXRoc1syXTtcbiAgICBpZiAoaG9zdG5hbWUubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRVJSX0lOVkFMSURfQVJHX1ZBTFVFKFxuICAgICAgICBcImZpbGVwYXRoXCIsXG4gICAgICAgIGZpbGVwYXRoLFxuICAgICAgICBcIkVtcHR5IFVOQyBzZXJ2ZXJuYW1lXCIsXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIFRPRE8od2FmdXdhZnUxMyk6IFRvIGJlIGBvdXRVUkwuaG9zdG5hbWUgPSBkb21haW5Ub0FTQ0lJKGhvc3RuYW1lKWAgb25jZSBgZG9tYWluVG9BU0NJSWAgYXJlIGltcGxlbWVudGVkXG4gICAgb3V0VVJMLmhvc3RuYW1lID0gaG9zdG5hbWU7XG4gICAgb3V0VVJMLnBhdGhuYW1lID0gZW5jb2RlUGF0aENoYXJzKHBhdGhzLnNsaWNlKDMpLmpvaW4oXCIvXCIpKTtcbiAgfSBlbHNlIHtcbiAgICBsZXQgcmVzb2x2ZWQgPSBwYXRoLnJlc29sdmUoZmlsZXBhdGgpO1xuICAgIC8vIHBhdGgucmVzb2x2ZSBzdHJpcHMgdHJhaWxpbmcgc2xhc2hlcyBzbyB3ZSBtdXN0IGFkZCB0aGVtIGJhY2tcbiAgICBjb25zdCBmaWxlUGF0aExhc3QgPSBmaWxlcGF0aC5jaGFyQ29kZUF0KGZpbGVwYXRoLmxlbmd0aCAtIDEpO1xuICAgIGlmIChcbiAgICAgIChmaWxlUGF0aExhc3QgPT09IENIQVJfRk9SV0FSRF9TTEFTSCB8fFxuICAgICAgICAoaXNXaW5kb3dzICYmIGZpbGVQYXRoTGFzdCA9PT0gQ0hBUl9CQUNLV0FSRF9TTEFTSCkpICYmXG4gICAgICByZXNvbHZlZFtyZXNvbHZlZC5sZW5ndGggLSAxXSAhPT0gcGF0aC5zZXBcbiAgICApIHtcbiAgICAgIHJlc29sdmVkICs9IFwiL1wiO1xuICAgIH1cblxuICAgIG91dFVSTC5wYXRobmFtZSA9IGVuY29kZVBhdGhDaGFycyhyZXNvbHZlZCk7XG4gIH1cbiAgcmV0dXJuIG91dFVSTDtcbn1cblxuaW50ZXJmYWNlIEh0dHBPcHRpb25zIHtcbiAgcHJvdG9jb2w6IHN0cmluZztcbiAgaG9zdG5hbWU6IHN0cmluZztcbiAgaGFzaDogc3RyaW5nO1xuICBzZWFyY2g6IHN0cmluZztcbiAgcGF0aG5hbWU6IHN0cmluZztcbiAgcGF0aDogc3RyaW5nO1xuICBocmVmOiBzdHJpbmc7XG4gIHBvcnQ/OiBudW1iZXI7XG4gIGF1dGg/OiBzdHJpbmc7XG59XG5cbi8qKlxuICogVGhpcyB1dGlsaXR5IGZ1bmN0aW9uIGNvbnZlcnRzIGEgVVJMIG9iamVjdCBpbnRvIGFuIG9yZGluYXJ5IG9wdGlvbnMgb2JqZWN0IGFzIGV4cGVjdGVkIGJ5IHRoZSBgaHR0cC5yZXF1ZXN0KClgIGFuZCBgaHR0cHMucmVxdWVzdCgpYCBBUElzLlxuICogQHNlZSBUZXN0ZWQgaW4gYHBhcmFsbGVsL3Rlc3QtdXJsLXVybHRvb3B0aW9ucy5qc2AuXG4gKiBAcGFyYW0gdXJsIFRoZSBgV0hBVFdHIFVSTGAgb2JqZWN0IHRvIGNvbnZlcnQgdG8gYW4gb3B0aW9ucyBvYmplY3QuXG4gKiBAcmV0dXJucyBIdHRwT3B0aW9uc1xuICogQHJldHVybnMgSHR0cE9wdGlvbnMucHJvdG9jb2wgUHJvdG9jb2wgdG8gdXNlLlxuICogQHJldHVybnMgSHR0cE9wdGlvbnMuaG9zdG5hbWUgQSBkb21haW4gbmFtZSBvciBJUCBhZGRyZXNzIG9mIHRoZSBzZXJ2ZXIgdG8gaXNzdWUgdGhlIHJlcXVlc3QgdG8uXG4gKiBAcmV0dXJucyBIdHRwT3B0aW9ucy5oYXNoIFRoZSBmcmFnbWVudCBwb3J0aW9uIG9mIHRoZSBVUkwuXG4gKiBAcmV0dXJucyBIdHRwT3B0aW9ucy5zZWFyY2ggVGhlIHNlcmlhbGl6ZWQgcXVlcnkgcG9ydGlvbiBvZiB0aGUgVVJMLlxuICogQHJldHVybnMgSHR0cE9wdGlvbnMucGF0aG5hbWUgVGhlIHBhdGggcG9ydGlvbiBvZiB0aGUgVVJMLlxuICogQHJldHVybnMgSHR0cE9wdGlvbnMucGF0aCBSZXF1ZXN0IHBhdGguIFNob3VsZCBpbmNsdWRlIHF1ZXJ5IHN0cmluZyBpZiBhbnkuIEUuRy4gYCcvaW5kZXguaHRtbD9wYWdlPTEyJ2AuIEFuIGV4Y2VwdGlvbiBpcyB0aHJvd24gd2hlbiB0aGUgcmVxdWVzdCBwYXRoIGNvbnRhaW5zIGlsbGVnYWwgY2hhcmFjdGVycy4gQ3VycmVudGx5LCBvbmx5IHNwYWNlcyBhcmUgcmVqZWN0ZWQgYnV0IHRoYXQgbWF5IGNoYW5nZSBpbiB0aGUgZnV0dXJlLlxuICogQHJldHVybnMgSHR0cE9wdGlvbnMuaHJlZiBUaGUgc2VyaWFsaXplZCBVUkwuXG4gKiBAcmV0dXJucyBIdHRwT3B0aW9ucy5wb3J0IFBvcnQgb2YgcmVtb3RlIHNlcnZlci5cbiAqIEByZXR1cm5zIEh0dHBPcHRpb25zLmF1dGggQmFzaWMgYXV0aGVudGljYXRpb24gaS5lLiBgJ3VzZXI6cGFzc3dvcmQnYCB0byBjb21wdXRlIGFuIEF1dGhvcml6YXRpb24gaGVhZGVyLlxuICovXG5mdW5jdGlvbiB1cmxUb0h0dHBPcHRpb25zKHVybDogVVJMKTogSHR0cE9wdGlvbnMge1xuICBjb25zdCBvcHRpb25zOiBIdHRwT3B0aW9ucyA9IHtcbiAgICBwcm90b2NvbDogdXJsLnByb3RvY29sLFxuICAgIGhvc3RuYW1lOiB0eXBlb2YgdXJsLmhvc3RuYW1lID09PSBcInN0cmluZ1wiICYmIHVybC5ob3N0bmFtZS5zdGFydHNXaXRoKFwiW1wiKVxuICAgICAgPyB1cmwuaG9zdG5hbWUuc2xpY2UoMSwgLTEpXG4gICAgICA6IHVybC5ob3N0bmFtZSxcbiAgICBoYXNoOiB1cmwuaGFzaCxcbiAgICBzZWFyY2g6IHVybC5zZWFyY2gsXG4gICAgcGF0aG5hbWU6IHVybC5wYXRobmFtZSxcbiAgICBwYXRoOiBgJHt1cmwucGF0aG5hbWUgfHwgXCJcIn0ke3VybC5zZWFyY2ggfHwgXCJcIn1gLFxuICAgIGhyZWY6IHVybC5ocmVmLFxuICB9O1xuICBpZiAodXJsLnBvcnQgIT09IFwiXCIpIHtcbiAgICBvcHRpb25zLnBvcnQgPSBOdW1iZXIodXJsLnBvcnQpO1xuICB9XG4gIGlmICh1cmwudXNlcm5hbWUgfHwgdXJsLnBhc3N3b3JkKSB7XG4gICAgb3B0aW9ucy5hdXRoID0gYCR7ZGVjb2RlVVJJQ29tcG9uZW50KHVybC51c2VybmFtZSl9OiR7XG4gICAgICBkZWNvZGVVUklDb21wb25lbnQoXG4gICAgICAgIHVybC5wYXNzd29yZCxcbiAgICAgIClcbiAgICB9YDtcbiAgfVxuICByZXR1cm4gb3B0aW9ucztcbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICBwYXJzZSxcbiAgZm9ybWF0LFxuICByZXNvbHZlT2JqZWN0LFxuICBmaWxlVVJMVG9QYXRoLFxuICBwYXRoVG9GaWxlVVJMLFxuICB1cmxUb0h0dHBPcHRpb25zLFxuICBVcmwsXG4gIFVSTCxcbn07XG4iXX0=
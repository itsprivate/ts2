import { CHAR_BACKWARD_SLASH, CHAR_DOT, CHAR_FORWARD_SLASH, CHAR_LOWERCASE_A, CHAR_LOWERCASE_Z, CHAR_UPPERCASE_A, CHAR_UPPERCASE_Z, } from "./_constants.ts";
export function assertPath(path) {
    if (typeof path !== "string") {
        throw new TypeError(`Path must be a string. Received ${JSON.stringify(path)}`);
    }
}
export function isPosixPathSeparator(code) {
    return code === CHAR_FORWARD_SLASH;
}
export function isPathSeparator(code) {
    return isPosixPathSeparator(code) || code === CHAR_BACKWARD_SLASH;
}
export function isWindowsDeviceRoot(code) {
    return ((code >= CHAR_LOWERCASE_A && code <= CHAR_LOWERCASE_Z) ||
        (code >= CHAR_UPPERCASE_A && code <= CHAR_UPPERCASE_Z));
}
export function normalizeString(path, allowAboveRoot, separator, isPathSeparator) {
    let res = "";
    let lastSegmentLength = 0;
    let lastSlash = -1;
    let dots = 0;
    let code;
    for (let i = 0, len = path.length; i <= len; ++i) {
        if (i < len)
            code = path.charCodeAt(i);
        else if (isPathSeparator(code))
            break;
        else
            code = CHAR_FORWARD_SLASH;
        if (isPathSeparator(code)) {
            if (lastSlash === i - 1 || dots === 1) {
            }
            else if (lastSlash !== i - 1 && dots === 2) {
                if (res.length < 2 ||
                    lastSegmentLength !== 2 ||
                    res.charCodeAt(res.length - 1) !== CHAR_DOT ||
                    res.charCodeAt(res.length - 2) !== CHAR_DOT) {
                    if (res.length > 2) {
                        const lastSlashIndex = res.lastIndexOf(separator);
                        if (lastSlashIndex === -1) {
                            res = "";
                            lastSegmentLength = 0;
                        }
                        else {
                            res = res.slice(0, lastSlashIndex);
                            lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
                        }
                        lastSlash = i;
                        dots = 0;
                        continue;
                    }
                    else if (res.length === 2 || res.length === 1) {
                        res = "";
                        lastSegmentLength = 0;
                        lastSlash = i;
                        dots = 0;
                        continue;
                    }
                }
                if (allowAboveRoot) {
                    if (res.length > 0)
                        res += `${separator}..`;
                    else
                        res = "..";
                    lastSegmentLength = 2;
                }
            }
            else {
                if (res.length > 0)
                    res += separator + path.slice(lastSlash + 1, i);
                else
                    res = path.slice(lastSlash + 1, i);
                lastSegmentLength = i - lastSlash - 1;
            }
            lastSlash = i;
            dots = 0;
        }
        else if (code === CHAR_DOT && dots !== -1) {
            ++dots;
        }
        else {
            dots = -1;
        }
    }
    return res;
}
export function _format(sep, pathObject) {
    const dir = pathObject.dir || pathObject.root;
    const base = pathObject.base ||
        (pathObject.name || "") + (pathObject.ext || "");
    if (!dir)
        return base;
    if (dir === pathObject.root)
        return dir + base;
    return dir + sep + base;
}
const WHITESPACE_ENCODINGS = {
    "\u0009": "%09",
    "\u000A": "%0A",
    "\u000B": "%0B",
    "\u000C": "%0C",
    "\u000D": "%0D",
    "\u0020": "%20",
};
export function encodeWhitespace(string) {
    return string.replaceAll(/[\s]/g, (c) => {
        return WHITESPACE_ENCODINGS[c] ?? c;
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX3V0aWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJfdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFLQSxPQUFPLEVBQ0wsbUJBQW1CLEVBQ25CLFFBQVEsRUFDUixrQkFBa0IsRUFDbEIsZ0JBQWdCLEVBQ2hCLGdCQUFnQixFQUNoQixnQkFBZ0IsRUFDaEIsZ0JBQWdCLEdBQ2pCLE1BQU0saUJBQWlCLENBQUM7QUFFekIsTUFBTSxVQUFVLFVBQVUsQ0FBQyxJQUFZO0lBQ3JDLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFO1FBQzVCLE1BQU0sSUFBSSxTQUFTLENBQ2pCLG1DQUFtQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQzFELENBQUM7S0FDSDtBQUNILENBQUM7QUFFRCxNQUFNLFVBQVUsb0JBQW9CLENBQUMsSUFBWTtJQUMvQyxPQUFPLElBQUksS0FBSyxrQkFBa0IsQ0FBQztBQUNyQyxDQUFDO0FBRUQsTUFBTSxVQUFVLGVBQWUsQ0FBQyxJQUFZO0lBQzFDLE9BQU8sb0JBQW9CLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxLQUFLLG1CQUFtQixDQUFDO0FBQ3BFLENBQUM7QUFFRCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsSUFBWTtJQUM5QyxPQUFPLENBQ0wsQ0FBQyxJQUFJLElBQUksZ0JBQWdCLElBQUksSUFBSSxJQUFJLGdCQUFnQixDQUFDO1FBQ3RELENBQUMsSUFBSSxJQUFJLGdCQUFnQixJQUFJLElBQUksSUFBSSxnQkFBZ0IsQ0FBQyxDQUN2RCxDQUFDO0FBQ0osQ0FBQztBQUdELE1BQU0sVUFBVSxlQUFlLENBQzdCLElBQVksRUFDWixjQUF1QixFQUN2QixTQUFpQixFQUNqQixlQUEwQztJQUUxQyxJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7SUFDYixJQUFJLGlCQUFpQixHQUFHLENBQUMsQ0FBQztJQUMxQixJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNuQixJQUFJ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QUU7WUFDM0MsRUFBRSxJQUFJLENBQUM7U0FDUjthQUFNO1lBQ0wsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQ1g7S0FDRjtJQUNELE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQztBQUVELE1BQU0sVUFBVSxPQUFPLENBQ3JCLEdBQVcsRUFDWCxVQUFpQztJQUVqQyxNQUFNLEdBQUcsR0FBdUIsVUFBVSxDQUFDLEdBQUcsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDO0lBQ2xFLE1BQU0sSUFBSSxHQUFXLFVBQVUsQ0FBQyxJQUFJO1FBQ2xDLENBQUMsVUFBVSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLElBQUksRUFBRSxDQUFDLENBQUM7SUFDbkQsSUFBSSxDQUFDLEdBQUc7UUFBRSxPQUFPLElBQUksQ0FBQztJQUN0QixJQUFJLEdBQUcsS0FBSyxVQUFVLENBQUMsSUFBSTtRQUFFLE9BQU8sR0FBRyxHQUFHLElBQUksQ0FBQztJQUMvQyxPQUFPLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDO0FBQzFCLENBQUM7QUFFRCxNQUFNLG9CQUFvQixHQUEyQjtJQUNuRCxRQUFRLEVBQUUsS0FBSztJQUNmLFFBQVEsRUFBRSxLQUFLO0lBQ2YsUUFBUSxFQUFFLEtBQUs7SUFDZixRQUFRLEVBQUUsS0FBSztJQUNmLFFBQVEsRUFBRSxLQUFLO0lBQ2YsUUFBUSxFQUFFLEtBQUs7Q0FDaEIsQ0FBQztBQUVGLE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxNQUFjO0lBQzdDLE9BQU8sTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRTtRQUN0QyxPQUFPLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0QyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgdGhlIEJyb3dzZXJpZnkgYXV0aG9ycy4gTUlUIExpY2Vuc2UuXG4vLyBQb3J0ZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vYnJvd3NlcmlmeS9wYXRoLWJyb3dzZXJpZnkvXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbmltcG9ydCB0eXBlIHsgRm9ybWF0SW5wdXRQYXRoT2JqZWN0IH0gZnJvbSBcIi4vX2ludGVyZmFjZS50c1wiO1xuaW1wb3J0IHtcbiAgQ0hBUl9CQUNLV0FSRF9TTEFTSCxcbiAgQ0hBUl9ET1QsXG4gIENIQVJfRk9SV0FSRF9TTEFTSCxcbiAgQ0hBUl9MT1dFUkNBU0VfQSxcbiAgQ0hBUl9MT1dFUkNBU0VfWixcbiAgQ0hBUl9VUFBFUkNBU0VfQSxcbiAgQ0hBUl9VUFBFUkNBU0VfWixcbn0gZnJvbSBcIi4vX2NvbnN0YW50cy50c1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0UGF0aChwYXRoOiBzdHJpbmcpOiB2b2lkIHtcbiAgaWYgKHR5cGVvZiBwYXRoICE9PSBcInN0cmluZ1wiKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgIGBQYXRoIG11c3QgYmUgYSBzdHJpbmcuIFJlY2VpdmVkICR7SlNPTi5zdHJpbmdpZnkocGF0aCl9YCxcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1Bvc2l4UGF0aFNlcGFyYXRvcihjb2RlOiBudW1iZXIpOiBib29sZWFuIHtcbiAgcmV0dXJuIGNvZGUgPT09IENIQVJfRk9SV0FSRF9TTEFTSDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzUGF0aFNlcGFyYXRvcihjb2RlOiBudW1iZXIpOiBib29sZWFuIHtcbiAgcmV0dXJuIGlzUG9zaXhQYXRoU2VwYXJhdG9yKGNvZGUpIHx8IGNvZGUgPT09IENIQVJfQkFDS1dBUkRfU0xBU0g7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1dpbmRvd3NEZXZpY2VSb290KGNvZGU6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gKFxuICAgIChjb2RlID49IENIQVJfTE9XRVJDQVNFX0EgJiYgY29kZSA8PSBDSEFSX0xPV0VSQ0FTRV9aKSB8fFxuICAgIChjb2RlID49IENIQVJfVVBQRVJDQVNFX0EgJiYgY29kZSA8PSBDSEFSX1VQUEVSQ0FTRV9aKVxuICApO1xufVxuXG4vLyBSZXNvbHZlcyAuIGFuZCAuLiBlbGVtZW50cyBpbiBhIHBhdGggd2l0aCBkaXJlY3RvcnkgbmFtZXNcbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVTdHJpbmcoXG4gIHBhdGg6IHN0cmluZyxcbiAgYWxsb3dBYm92ZVJvb3Q6IGJvb2xlYW4sXG4gIHNlcGFyYXRvcjogc3RyaW5nLFxuICBpc1BhdGhTZXBhcmF0b3I6IChjb2RlOiBudW1iZXIpID0+IGJvb2xlYW4sXG4pOiBzdHJpbmcge1xuICBsZXQgcmVzID0gXCJcIjtcbiAgbGV0IGxhc3RTZWdtZW50TGVuZ3RoID0gMDtcbiAgbGV0IGxhc3RTbGFzaCA9IC0xO1xuICBsZXQgZG90cyA9IDA7XG4gIGxldCBjb2RlOiBudW1iZXIgfCB1bmRlZmluZWQ7XG4gIGZvciAobGV0IGkgPSAwLCBsZW4gPSBwYXRoLmxlbmd0aDsgaSA8PSBsZW47ICsraSkge1xuICAgIGlmIChpIDwgbGVuKSBjb2RlID0gcGF0aC5jaGFyQ29kZUF0KGkpO1xuICAgIGVsc2UgaWYgKGlzUGF0aFNlcGFyYXRvcihjb2RlISkpIGJyZWFrO1xuICAgIGVsc2UgY29kZSA9IENIQVJfRk9SV0FSRF9TTEFTSDtcblxuICAgIGlmIChpc1BhdGhTZXBhcmF0b3IoY29kZSEpKSB7XG4gICAgICBpZiAobGFzdFNsYXNoID09PSBpIC0gMSB8fCBkb3RzID09PSAxKSB7XG4gICAgICAgIC8vIE5PT1BcbiAgICAgIH0gZWxzZSBpZiAobGFzdFNsYXNoICE9PSBpIC0gMSAmJiBkb3RzID09PSAyKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICByZXMubGVuZ3RoIDwgMiB8fFxuICAgICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoICE9PSAyIHx8XG4gICAgICAgICAgcmVzLmNoYXJDb2RlQXQocmVzLmxlbmd0aCAtIDEpICE9PSBDSEFSX0RPVCB8fFxuICAgICAgICAgIHJlcy5jaGFyQ29kZUF0KHJlcy5sZW5ndGggLSAyKSAhPT0gQ0hBUl9ET1RcbiAgICAgICAgKSB7XG4gICAgICAgICAgaWYgKHJlcy5sZW5ndGggPiAyKSB7XG4gICAgICAgICAgICBjb25zdCBsYXN0U2xhc2hJbmRleCA9IHJlcy5sYXN0SW5kZXhPZihzZXBhcmF0b3IpO1xuICAgICAgICAgICAgaWYgKGxhc3RTbGFzaEluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICByZXMgPSBcIlwiO1xuICAgICAgICAgICAgICBsYXN0U2VnbWVudExlbmd0aCA9IDA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXMgPSByZXMuc2xpY2UoMCwgbGFzdFNsYXNoSW5kZXgpO1xuICAgICAgICAgICAgICBsYXN0U2VnbWVudExlbmd0aCA9IHJlcy5sZW5ndGggLSAxIC0gcmVzLmxhc3RJbmRleE9mKHNlcGFyYXRvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsYXN0U2xhc2ggPSBpO1xuICAgICAgICAgICAgZG90cyA9IDA7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHJlcy5sZW5ndGggPT09IDIgfHwgcmVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgcmVzID0gXCJcIjtcbiAgICAgICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoID0gMDtcbiAgICAgICAgICAgIGxhc3RTbGFzaCA9IGk7XG4gICAgICAgICAgICBkb3RzID0gMDtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoYWxsb3dBYm92ZVJvb3QpIHtcbiAgICAgICAgICBpZiAocmVzLmxlbmd0aCA+IDApIHJlcyArPSBgJHtzZXBhcmF0b3J9Li5gO1xuICAgICAgICAgIGVsc2UgcmVzID0gXCIuLlwiO1xuICAgICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoID0gMjtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHJlcy5sZW5ndGggPiAwKSByZXMgKz0gc2VwYXJhdG9yICsgcGF0aC5zbGljZShsYXN0U2xhc2ggKyAxLCBpKTtcbiAgICAgICAgZWxzZSByZXMgPSBwYXRoLnNsaWNlKGxhc3RTbGFzaCArIDEsIGkpO1xuICAgICAgICBsYXN0U2VnbWVudExlbmd0aCA9IGkgLSBsYXN0U2xhc2ggLSAxO1xuICAgICAgfVxuICAgICAgbGFzdFNsYXNoID0gaTtcbiAgICAgIGRvdHMgPSAwO1xuICAgIH0gZWxzZSBpZiAoY29kZSA9PT0gQ0hBUl9ET1QgJiYgZG90cyAhPT0gLTEpIHtcbiAgICAgICsrZG90cztcbiAgICB9IGVsc2Uge1xuICAgICAgZG90cyA9IC0xO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gX2Zvcm1hdChcbiAgc2VwOiBzdHJpbmcsXG4gIHBhdGhPYmplY3Q6IEZvcm1hdElucHV0UGF0aE9iamVjdCxcbik6IHN0cmluZyB7XG4gIGNvbnN0IGRpcjogc3RyaW5nIHwgdW5kZWZpbmVkID0gcGF0aE9iamVjdC5kaXIgfHwgcGF0aE9iamVjdC5yb290O1xuICBjb25zdCBiYXNlOiBzdHJpbmcgPSBwYXRoT2JqZWN0LmJhc2UgfHxcbiAgICAocGF0aE9iamVjdC5uYW1lIHx8IFwiXCIpICsgKHBhdGhPYmplY3QuZXh0IHx8IFwiXCIpO1xuICBpZiAoIWRpcikgcmV0dXJuIGJhc2U7XG4gIGlmIChkaXIgPT09IHBhdGhPYmplY3Qucm9vdCkgcmV0dXJuIGRpciArIGJhc2U7XG4gIHJldHVybiBkaXIgKyBzZXAgKyBiYXNlO1xufVxuXG5jb25zdCBXSElURVNQQUNFX0VOQ09ESU5HUzogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgXCJcXHUwMDA5XCI6IFwiJTA5XCIsXG4gIFwiXFx1MDAwQVwiOiBcIiUwQVwiLFxuICBcIlxcdTAwMEJcIjogXCIlMEJcIixcbiAgXCJcXHUwMDBDXCI6IFwiJTBDXCIsXG4gIFwiXFx1MDAwRFwiOiBcIiUwRFwiLFxuICBcIlxcdTAwMjBcIjogXCIlMjBcIixcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBlbmNvZGVXaGl0ZXNwYWNlKHN0cmluZzogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHN0cmluZy5yZXBsYWNlQWxsKC9bXFxzXS9nLCAoYykgPT4ge1xuICAgIHJldHVybiBXSElURVNQQUNFX0VOQ09ESU5HU1tjXSA/PyBjO1xuICB9KTtcbn1cbiJdfQ==
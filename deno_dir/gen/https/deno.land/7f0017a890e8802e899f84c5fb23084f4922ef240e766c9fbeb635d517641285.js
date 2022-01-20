export function indexOf(source, pat, start = 0) {
    if (start >= source.length) {
        return -1;
    }
    if (start < 0) {
        start = 0;
    }
    const s = pat[0];
    for (let i = start; i < source.length; i++) {
        if (source[i] !== s)
            continue;
        const pin = i;
        let matched = 1;
        let j = i;
        while (matched < pat.length) {
            j++;
            if (source[j] !== pat[j - pin]) {
                break;
            }
            matched++;
        }
        if (matched === pat.length) {
            return pin;
        }
    }
    return -1;
}
export function lastIndexOf(source, pat, start = source.length - 1) {
    if (start < 0) {
        return -1;
    }
    if (start >= source.length) {
        start = source.length - 1;
    }
    const e = pat[pat.length - 1];
    for (let i = start; i >= 0; i--) {
        if (source[i] !== e)
            continue;
        const pin = i;
        let matched = 1;
        let j = i;
        while (matched < pat.length) {
            j--;
            if (source[j] !== pat[pat.length - 1 - (pin - j)]) {
                break;
            }
            matched++;
        }
        if (matched === pat.length) {
            return pin - pat.length + 1;
        }
    }
    return -1;
}
export function equals(a, b) {
    if (a.length !== b.length)
        return false;
    for (let i = 0; i < b.length; i++) {
        if (a[i] !== b[i])
            return false;
    }
    return true;
}
export function startsWith(source, prefix) {
    for (let i = 0, max = prefix.length; i < max; i++) {
        if (source[i] !== prefix[i])
            return false;
    }
    return true;
}
export function endsWith(source, suffix) {
    for (let srci = source.length - 1, sfxi = suffix.length - 1; sfxi >= 0; srci--, sfxi--) {
        if (source[srci] !== suffix[sfxi])
            return false;
    }
    return true;
}
export function repeat(origin, count) {
    if (count === 0) {
        return new Uint8Array();
    }
    if (count < 0) {
        throw new RangeError("bytes: negative repeat count");
    }
    else if ((origin.length * count) / count !== origin.length) {
        throw new Error("bytes: repeat count causes overflow");
    }
    const int = Math.floor(count);
    if (int !== count) {
        throw new Error("bytes: repeat count must be an integer");
    }
    const nb = new Uint8Array(origin.length * count);
    let bp = copy(origin, nb);
    for (; bp < nb.length; bp *= 2) {
        copy(nb.slice(0, bp), nb, bp);
    }
    return nb;
}
export function concat(...buf) {
    let length = 0;
    for (const b of buf) {
        length += b.length;
    }
    const output = new Uint8Array(length);
    let index = 0;
    for (const b of buf) {
        output.set(b, index);
        index += b.length;
    }
    return output;
}
export function contains(source, pat) {
    return indexOf(source, pat) != -1;
}
export function copy(src, dst, off = 0) {
    off = Math.max(0, Math.min(off, dst.byteLength));
    const dstBytesAvailable = dst.byteLength - off;
    if (src.byteLength > dstBytesAvailable) {
        src = src.subarray(0, dstBytesAvailable);
    }
    dst.set(src, off);
    return src.byteLength;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibW9kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQU9BLE1BQU0sVUFBVSxPQUFPLENBQ3JCLE1BQWtCLEVBQ2xCLEdBQWUsRUFDZixLQUFLLEdBQUcsQ0FBQztJQUVULElBQUksS0FBSyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUU7UUFDMUIsT0FBTyxDQUFDLENBQUMsQ0FBQztLQUNYO0lBQ0QsSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFO1FBQ2IsS0FBSyxHQUFHLENBQUMsQ0FBQztLQUNYO0lBQ0QsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2pCLEtBQUssSUFBSSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQzFDLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFBRSxTQUFTO1FBQzlCLE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBQztRQUNkLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQztRQUNoQixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDVixPQUFPLE9BQU8sR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFO1lBQzNCLENBQUMsRUFBRSxDQUFDO1lBQ0osSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsRUFBRTtnQkFDOUIsTUFBTTthQUNQO1lBQ0QsT0FBTyxFQUFFLENBQUM7U0FDWDtRQUNELElBQUksT0FBTyxLQUFLLEdBQUcsQ0FBQyxNQUFNLEVBQUU7WUFDMUIsT0FBTyxHQUFHLENBQUM7U0FDWjtLQUNGO0lBQ0QsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUNaLENBQUM7QUFPRCxNQUFNLFVBQVUsV0FBVyxDQUN6QixNQUFrQixFQUNsQixHQUFlLEVBQ2YsS0FBSyxHQUFHLE1BQU0sQ0FBQyxN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RUFBRSxLQUFLLENBQUMsQ0FBQztRQUNyQixLQUFLLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQztLQUNuQjtJQUVELE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFNRCxNQUFNLFVBQVUsUUFBUSxDQUFDLE1BQWtCLEVBQUUsR0FBZTtJQUMxRCxPQUFPLE9BQU8sQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDcEMsQ0FBQztBQVdELE1BQU0sVUFBVSxJQUFJLENBQUMsR0FBZSxFQUFFLEdBQWUsRUFBRSxHQUFHLEdBQUcsQ0FBQztJQUM1RCxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFDakQsTUFBTSxpQkFBaUIsR0FBRyxHQUFHLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQztJQUMvQyxJQUFJLEdBQUcsQ0FBQyxVQUFVLEdBQUcsaUJBQWlCLEVBQUU7UUFDdEMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLGlCQUFpQixDQUFDLENBQUM7S0FDMUM7SUFDRCxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNsQixPQUFPLEdBQUcsQ0FBQyxVQUFVLENBQUM7QUFDeEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjEgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbi8qKiBGaW5kIGZpcnN0IGluZGV4IG9mIGJpbmFyeSBwYXR0ZXJuIGZyb20gc291cmNlLiBJZiBub3QgZm91bmQsIHRoZW4gcmV0dXJuIC0xXG4gKiBAcGFyYW0gc291cmNlIHNvdXJjZSBhcnJheVxuICogQHBhcmFtIHBhdCBwYXR0ZXJuIHRvIGZpbmQgaW4gc291cmNlIGFycmF5XG4gKiBAcGFyYW0gc3RhcnQgdGhlIGluZGV4IHRvIHN0YXJ0IGxvb2tpbmcgaW4gdGhlIHNvdXJjZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5kZXhPZihcbiAgc291cmNlOiBVaW50OEFycmF5LFxuICBwYXQ6IFVpbnQ4QXJyYXksXG4gIHN0YXJ0ID0gMCxcbik6IG51bWJlciB7XG4gIGlmIChzdGFydCA+PSBzb3VyY2UubGVuZ3RoKSB7XG4gICAgcmV0dXJuIC0xO1xuICB9XG4gIGlmIChzdGFydCA8IDApIHtcbiAgICBzdGFydCA9IDA7XG4gIH1cbiAgY29uc3QgcyA9IHBhdFswXTtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgc291cmNlLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHNvdXJjZVtpXSAhPT0gcykgY29udGludWU7XG4gICAgY29uc3QgcGluID0gaTtcbiAgICBsZXQgbWF0Y2hlZCA9IDE7XG4gICAgbGV0IGogPSBpO1xuICAgIHdoaWxlIChtYXRjaGVkIDwgcGF0Lmxlbmd0aCkge1xuICAgICAgaisrO1xuICAgICAgaWYgKHNvdXJjZVtqXSAhPT0gcGF0W2ogLSBwaW5dKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgbWF0Y2hlZCsrO1xuICAgIH1cbiAgICBpZiAobWF0Y2hlZCA9PT0gcGF0Lmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHBpbjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG4vKiogRmluZCBsYXN0IGluZGV4IG9mIGJpbmFyeSBwYXR0ZXJuIGZyb20gc291cmNlLiBJZiBub3QgZm91bmQsIHRoZW4gcmV0dXJuIC0xLlxuICogQHBhcmFtIHNvdXJjZSBzb3VyY2UgYXJyYXlcbiAqIEBwYXJhbSBwYXQgcGF0dGVybiB0byBmaW5kIGluIHNvdXJjZSBhcnJheVxuICogQHBhcmFtIHN0YXJ0IHRoZSBpbmRleCB0byBzdGFydCBsb29raW5nIGluIHRoZSBzb3VyY2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxhc3RJbmRleE9mKFxuICBzb3VyY2U6IFVpbnQ4QXJyYXksXG4gIHBhdDogVWludDhBcnJheSxcbiAgc3RhcnQgPSBzb3VyY2UubGVuZ3RoIC0gMSxcbik6IG51bWJlciB7XG4gIGlmIChzdGFydCA8IDApIHtcbiAgICByZXR1cm4gLTE7XG4gIH1cbiAgaWYgKHN0YXJ0ID49IHNvdXJjZS5sZW5ndGgpIHtcbiAgICBzdGFydCA9IHNvdXJjZS5sZW5ndGggLSAxO1xuICB9XG4gIGNvbnN0IGUgPSBwYXRbcGF0Lmxlbmd0aCAtIDFdO1xuICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPj0gMDsgaS0tKSB7XG4gICAgaWYgKHNvdXJjZVtpXSAhPT0gZSkgY29udGludWU7XG4gICAgY29uc3QgcGluID0gaTtcbiAgICBsZXQgbWF0Y2hlZCA9IDE7XG4gICAgbGV0IGogPSBpO1xuICAgIHdoaWxlIChtYXRjaGVkIDwgcGF0Lmxlbmd0aCkge1xuICAgICAgai0tO1xuICAgICAgaWYgKHNvdXJjZVtqXSAhPT0gcGF0W3BhdC5sZW5ndGggLSAxIC0gKHBpbiAtIGopXSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIG1hdGNoZWQrKztcbiAgICB9XG4gICAgaWYgKG1hdGNoZWQgPT09IHBhdC5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBwaW4gLSBwYXQubGVuZ3RoICsgMTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG4vKiogQ2hlY2sgd2hldGhlciBiaW5hcnkgYXJyYXlzIGFyZSBlcXVhbCB0byBlYWNoIG90aGVyLlxuICogQHBhcmFtIGEgZmlyc3QgYXJyYXkgdG8gY2hlY2sgZXF1YWxpdHlcbiAqIEBwYXJhbSBiIHNlY29uZCBhcnJheSB0byBjaGVjayBlcXVhbGl0eVxuICovXG5leHBvcnQgZnVuY3Rpb24gZXF1YWxzKGE6IFVpbnQ4QXJyYXksIGI6IFVpbnQ4QXJyYXkpOiBib29sZWFuIHtcbiAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGIubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoYVtpXSAhPT0gYltpXSkgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKiogQ2hlY2sgd2hldGhlciBiaW5hcnkgYXJyYXkgc3RhcnRzIHdpdGggcHJlZml4LlxuICogQHBhcmFtIHNvdXJjZSBzb3VyY2UgYXJyYXlcbiAqIEBwYXJhbSBwcmVmaXggcHJlZml4IGFycmF5IHRvIGNoZWNrIGluIHNvdXJjZVxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RhcnRzV2l0aChzb3VyY2U6IFVpbnQ4QXJyYXksIHByZWZpeDogVWludDhBcnJheSk6IGJvb2xlYW4ge1xuICBmb3IgKGxldCBpID0gMCwgbWF4ID0gcHJlZml4Lmxlbmd0aDsgaSA8IG1heDsgaSsrKSB7XG4gICAgaWYgKHNvdXJjZVtpXSAhPT0gcHJlZml4W2ldKSByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKiBDaGVjayB3aGV0aGVyIGJpbmFyeSBhcnJheSBlbmRzIHdpdGggc3VmZml4LlxuICogQHBhcmFtIHNvdXJjZSBzb3VyY2UgYXJyYXlcbiAqIEBwYXJhbSBzdWZmaXggc3VmZml4IGFycmF5IHRvIGNoZWNrIGluIHNvdXJjZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5kc1dpdGgoc291cmNlOiBVaW50OEFycmF5LCBzdWZmaXg6IFVpbnQ4QXJyYXkpOiBib29sZWFuIHtcbiAgZm9yIChcbiAgICBsZXQgc3JjaSA9IHNvdXJjZS5sZW5ndGggLSAxLCBzZnhpID0gc3VmZml4Lmxlbmd0aCAtIDE7XG4gICAgc2Z4aSA+PSAwO1xuICAgIHNyY2ktLSwgc2Z4aS0tXG4gICkge1xuICAgIGlmIChzb3VyY2Vbc3JjaV0gIT09IHN1ZmZpeFtzZnhpXSkgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKiogUmVwZWF0IGJ5dGVzLiByZXR1cm5zIGEgbmV3IGJ5dGUgc2xpY2UgY29uc2lzdGluZyBvZiBgY291bnRgIGNvcGllcyBvZiBgYmAuXG4gKiBAcGFyYW0gb3JpZ2luIFRoZSBvcmlnaW4gYnl0ZXNcbiAqIEBwYXJhbSBjb3VudCBUaGUgY291bnQgeW91IHdhbnQgdG8gcmVwZWF0LlxuICogQHRocm93cyBgUmFuZ2VFcnJvcmAgV2hlbiBjb3VudCBpcyBuZWdhdGl2ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVwZWF0KG9yaWdpbjogVWludDhBcnJheSwgY291bnQ6IG51bWJlcik6IFVpbnQ4QXJyYXkge1xuICBpZiAoY291bnQgPT09IDApIHtcbiAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoKTtcbiAgfVxuXG4gIGlmIChjb3VudCA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcImJ5dGVzOiBuZWdhdGl2ZSByZXBlYXQgY291bnRcIik7XG4gIH0gZWxzZSBpZiAoKG9yaWdpbi5sZW5ndGggKiBjb3VudCkgLyBjb3VudCAhPT0gb3JpZ2luLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcImJ5dGVzOiByZXBlYXQgY291bnQgY2F1c2VzIG92ZXJmbG93XCIpO1xuICB9XG5cbiAgY29uc3QgaW50ID0gTWF0aC5mbG9vcihjb3VudCk7XG5cbiAgaWYgKGludCAhPT0gY291bnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJieXRlczogcmVwZWF0IGNvdW50IG11c3QgYmUgYW4gaW50ZWdlclwiKTtcbiAgfVxuXG4gIGNvbnN0IG5iID0gbmV3IFVpbnQ4QXJyYXkob3JpZ2luLmxlbmd0aCAqIGNvdW50KTtcblxuICBsZXQgYnAgPSBjb3B5KG9yaWdpbiwgbmIpO1xuXG4gIGZvciAoOyBicCA8IG5iLmxlbmd0aDsgYnAgKj0gMikge1xuICAgIGNvcHkobmIuc2xpY2UoMCwgYnApLCBuYiwgYnApO1xuICB9XG5cbiAgcmV0dXJuIG5iO1xufVxuXG4vKiogQ29uY2F0ZW5hdGUgbXVsdGlwbGUgYmluYXJ5IGFycmF5cyBhbmQgcmV0dXJuIG5ldyBvbmUuXG4gKiBAcGFyYW0gYnVmIGJpbmFyeSBhcnJheXMgdG8gY29uY2F0ZW5hdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbmNhdCguLi5idWY6IFVpbnQ4QXJyYXlbXSk6IFVpbnQ4QXJyYXkge1xuICBsZXQgbGVuZ3RoID0gMDtcbiAgZm9yIChjb25zdCBiIG9mIGJ1Zikge1xuICAgIGxlbmd0aCArPSBiLmxlbmd0aDtcbiAgfVxuXG4gIGNvbnN0IG91dHB1dCA9IG5ldyBVaW50OEFycmF5KGxlbmd0aCk7XG4gIGxldCBpbmRleCA9IDA7XG4gIGZvciAoY29uc3QgYiBvZiBidWYpIHtcbiAgICBvdXRwdXQuc2V0KGIsIGluZGV4KTtcbiAgICBpbmRleCArPSBiLmxlbmd0aDtcbiAgfVxuXG4gIHJldHVybiBvdXRwdXQ7XG59XG5cbi8qKiBDaGVjayBzb3VyY2UgYXJyYXkgY29udGFpbnMgcGF0dGVybiBhcnJheS5cbiAqIEBwYXJhbSBzb3VyY2Ugc291cmNlIGFycmF5XG4gKiBAcGFyYW0gcGF0IHBhdHRlciBhcnJheVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udGFpbnMoc291cmNlOiBVaW50OEFycmF5LCBwYXQ6IFVpbnQ4QXJyYXkpOiBib29sZWFuIHtcbiAgcmV0dXJuIGluZGV4T2Yoc291cmNlLCBwYXQpICE9IC0xO1xufVxuXG4vKipcbiAqIENvcHkgYnl0ZXMgZnJvbSBvbmUgVWludDhBcnJheSB0byBhbm90aGVyLiAgQnl0ZXMgZnJvbSBgc3JjYCB3aGljaCBkb24ndCBmaXRcbiAqIGludG8gYGRzdGAgd2lsbCBub3QgYmUgY29waWVkLlxuICpcbiAqIEBwYXJhbSBzcmMgU291cmNlIGJ5dGUgYXJyYXlcbiAqIEBwYXJhbSBkc3QgRGVzdGluYXRpb24gYnl0ZSBhcnJheVxuICogQHBhcmFtIG9mZiBPZmZzZXQgaW50byBgZHN0YCBhdCB3aGljaCB0byBiZWdpbiB3cml0aW5nIHZhbHVlcyBmcm9tIGBzcmNgLlxuICogQHJldHVybiBudW1iZXIgb2YgYnl0ZXMgY29waWVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb3B5KHNyYzogVWludDhBcnJheSwgZHN0OiBVaW50OEFycmF5LCBvZmYgPSAwKTogbnVtYmVyIHtcbiAgb2ZmID0gTWF0aC5tYXgoMCwgTWF0aC5taW4ob2ZmLCBkc3QuYnl0ZUxlbmd0aCkpO1xuICBjb25zdCBkc3RCeXRlc0F2YWlsYWJsZSA9IGRzdC5ieXRlTGVuZ3RoIC0gb2ZmO1xuICBpZiAoc3JjLmJ5dGVMZW5ndGggPiBkc3RCeXRlc0F2YWlsYWJsZSkge1xuICAgIHNyYyA9IHNyYy5zdWJhcnJheSgwLCBkc3RCeXRlc0F2YWlsYWJsZSk7XG4gIH1cbiAgZHN0LnNldChzcmMsIG9mZik7XG4gIHJldHVybiBzcmMuYnl0ZUxlbmd0aDtcbn1cbiJdfQ==
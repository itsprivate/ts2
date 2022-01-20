export function equalsNaive(a, b) {
    if (a.length !== b.length)
        return false;
    for (let i = 0; i < b.length; i++) {
        if (a[i] !== b[i])
            return false;
    }
    return true;
}
export function equalsSimd(a, b) {
    if (a.length !== b.length)
        return false;
    const len = a.length;
    const compressable = Math.floor(len / 4);
    const compressedA = new Uint32Array(a.buffer, 0, compressable);
    const compressedB = new Uint32Array(b.buffer, 0, compressable);
    for (let i = compressable * 4; i < len; i++) {
        if (a[i] !== b[i])
            return false;
    }
    for (let i = 0; i < compressedA.length; i++) {
        if (compressedA[i] !== compressedB[i])
            return false;
    }
    return true;
}
export function equals(a, b) {
    if (a.length < 1000)
        return equalsNaive(a, b);
    return equalsSimd(a, b);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXF1YWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZXF1YWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUtBLE1BQU0sVUFBVSxXQUFXLENBQUMsQ0FBYSxFQUFFLENBQWE7SUFDdEQsSUFBSSxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxNQUFNO1FBQUUsT0FBTyxLQUFLLENBQUM7SUFDeEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDakMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUFFLE9BQU8sS0FBSyxDQUFDO0tBQ2pDO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBT0QsTUFBTSxVQUFVLFVBQVUsQ0FBQyxDQUFhLEVBQUUsQ0FBYTtJQUNyRCxJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLE1BQU07UUFBRSxPQUFPLEtBQUssQ0FBQztJQUN4QyxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDO0lBQ3JCLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3pDLE1BQU0sV0FBVyxHQUFHLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQy9ELE1BQU0sV0FBVyxHQUFHLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQy9ELEtBQUssSUFBSSxDQUFDLEdBQUcsWUFBWSxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQzNDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFBRSxPQUFPLEtBQUssQ0FBQztLQUNqQztJQUNELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQzNDLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQyxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFBRSxPQUFPLEtBQUssQ0FBQztLQUNyRDtJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQU1ELE1BQU0sVUFBVSxNQUFNLENBQUMsQ0FBYSxFQUFFLENBQWE7SUFDakQsSUFBSSxDQUFDLENBQUMsTUFBTSxHQUFHLElBQUk7UUFBRSxPQUFPLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDOUMsT0FBTyxVQUFVLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQzFCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQ2hlY2sgd2hldGhlciBiaW5hcnkgYXJyYXlzIGFyZSBlcXVhbCB0byBlYWNoIG90aGVyIHVzaW5nIDgtYml0IGNvbXBhcmlzb25zLlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSBhIGZpcnN0IGFycmF5IHRvIGNoZWNrIGVxdWFsaXR5XG4gKiBAcGFyYW0gYiBzZWNvbmQgYXJyYXkgdG8gY2hlY2sgZXF1YWxpdHlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVxdWFsc05haXZlKGE6IFVpbnQ4QXJyYXksIGI6IFVpbnQ4QXJyYXkpOiBib29sZWFuIHtcbiAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGIubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoYVtpXSAhPT0gYltpXSkgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKiogQ2hlY2sgd2hldGhlciBiaW5hcnkgYXJyYXlzIGFyZSBlcXVhbCB0byBlYWNoIG90aGVyIHVzaW5nIDMyLWJpdCBjb21wYXJpc29ucy5cbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0gYSBmaXJzdCBhcnJheSB0byBjaGVjayBlcXVhbGl0eVxuICogQHBhcmFtIGIgc2Vjb25kIGFycmF5IHRvIGNoZWNrIGVxdWFsaXR5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlcXVhbHNTaW1kKGE6IFVpbnQ4QXJyYXksIGI6IFVpbnQ4QXJyYXkpOiBib29sZWFuIHtcbiAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuICBjb25zdCBsZW4gPSBhLmxlbmd0aDtcbiAgY29uc3QgY29tcHJlc3NhYmxlID0gTWF0aC5mbG9vcihsZW4gLyA0KTtcbiAgY29uc3QgY29tcHJlc3NlZEEgPSBuZXcgVWludDMyQXJyYXkoYS5idWZmZXIsIDAsIGNvbXByZXNzYWJsZSk7XG4gIGNvbnN0IGNvbXByZXNzZWRCID0gbmV3IFVpbnQzMkFycmF5KGIuYnVmZmVyLCAwLCBjb21wcmVzc2FibGUpO1xuICBmb3IgKGxldCBpID0gY29tcHJlc3NhYmxlICogNDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGFbaV0gIT09IGJbaV0pIHJldHVybiBmYWxzZTtcbiAgfVxuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXByZXNzZWRBLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGNvbXByZXNzZWRBW2ldICE9PSBjb21wcmVzc2VkQltpXSkgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKiogQ2hlY2sgd2hldGhlciBiaW5hcnkgYXJyYXlzIGFyZSBlcXVhbCB0byBlYWNoIG90aGVyLlxuICogQHBhcmFtIGEgZmlyc3QgYXJyYXkgdG8gY2hlY2sgZXF1YWxpdHlcbiAqIEBwYXJhbSBiIHNlY29uZCBhcnJheSB0byBjaGVjayBlcXVhbGl0eVxuICovXG5leHBvcnQgZnVuY3Rpb24gZXF1YWxzKGE6IFVpbnQ4QXJyYXksIGI6IFVpbnQ4QXJyYXkpOiBib29sZWFuIHtcbiAgaWYgKGEubGVuZ3RoIDwgMTAwMCkgcmV0dXJuIGVxdWFsc05haXZlKGEsIGIpO1xuICByZXR1cm4gZXF1YWxzU2ltZChhLCBiKTtcbn1cbiJdfQ==
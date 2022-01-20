export function deferred() {
    let methods;
    const promise = new Promise((resolve, reject) => {
        methods = { resolve, reject };
    });
    return Object.assign(promise, methods);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmZXJyZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkZWZlcnJlZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFtQkEsTUFBTSxVQUFVLFFBQVE7SUFDdEIsSUFBSSxPQUFPLENBQUM7SUFDWixNQUFNLE9BQU8sR0FBRyxJQUFJLE9BQU8sQ0FBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQVEsRUFBRTtRQUN2RCxPQUFPLEdBQUcsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLENBQUM7SUFDaEMsQ0FBQyxDQUFDLENBQUM7SUFDSCxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBZ0IsQ0FBQztBQUN4RCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMSB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRPRE8ocnkpIEl0J2QgYmUgYmV0dGVyIHRvIG1ha2UgRGVmZXJyZWQgYSBjbGFzcyB0aGF0IGluaGVyaXRzIGZyb21cbi8vIFByb21pc2UsIHJhdGhlciB0aGFuIGFuIGludGVyZmFjZS4gVGhpcyBpcyBwb3NzaWJsZSBpbiBFUzIwMTYsIGhvd2V2ZXJcbi8vIHR5cGVzY3JpcHQgcHJvZHVjZXMgYnJva2VuIGNvZGUgd2hlbiB0YXJnZXRpbmcgRVM1IGNvZGUuXG4vLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy8xNTIwMlxuLy8gQXQgdGhlIHRpbWUgb2Ygd3JpdGluZywgdGhlIGdpdGh1YiBpc3N1ZSBpcyBjbG9zZWQgYnV0IHRoZSBwcm9ibGVtIHJlbWFpbnMuXG5leHBvcnQgaW50ZXJmYWNlIERlZmVycmVkPFQ+IGV4dGVuZHMgUHJvbWlzZTxUPiB7XG4gIHJlc29sdmU6ICh2YWx1ZT86IFQgfCBQcm9taXNlTGlrZTxUPikgPT4gdm9pZDtcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgcmVqZWN0OiAocmVhc29uPzogYW55KSA9PiB2b2lkO1xufVxuXG4vKiogQ3JlYXRlcyBhIFByb21pc2Ugd2l0aCB0aGUgYHJlamVjdGAgYW5kIGByZXNvbHZlYCBmdW5jdGlvbnNcbiAqIHBsYWNlZCBhcyBtZXRob2RzIG9uIHRoZSBwcm9taXNlIG9iamVjdCBpdHNlbGYuIEl0IGFsbG93cyB5b3UgdG8gZG86XG4gKlxuICogICAgIGNvbnN0IHAgPSBkZWZlcnJlZDxudW1iZXI+KCk7XG4gKiAgICAgLy8gLi4uXG4gKiAgICAgcC5yZXNvbHZlKDQyKTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlZmVycmVkPFQ+KCk6IERlZmVycmVkPFQ+IHtcbiAgbGV0IG1ldGhvZHM7XG4gIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZTxUPigocmVzb2x2ZSwgcmVqZWN0KTogdm9pZCA9PiB7XG4gICAgbWV0aG9kcyA9IHsgcmVzb2x2ZSwgcmVqZWN0IH07XG4gIH0pO1xuICByZXR1cm4gT2JqZWN0LmFzc2lnbihwcm9taXNlLCBtZXRob2RzKSBhcyBEZWZlcnJlZDxUPjtcbn1cbiJdfQ==
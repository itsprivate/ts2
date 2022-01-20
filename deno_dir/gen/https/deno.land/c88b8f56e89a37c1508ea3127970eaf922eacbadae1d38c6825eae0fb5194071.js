import _JSZip from "https://dev.jspm.io/jszip@3.5.0";
import { ensureDir } from "https://deno.land/std@0.93.0/fs/ensure_dir.ts";
import { walk } from "https://deno.land/std@0.93.0/fs/walk.ts";
import { dirname, join, SEP } from "https://deno.land/std@0.93.0/path/mod.ts";
export async function readZip(path) {
    const z = new JSZip();
    const content = await Deno.readFile(path);
    await z.loadAsync(content);
    return z;
}
export async function zipDir(dir, options) {
    const z = new JSZip();
    const cwd = Deno.cwd();
    Deno.chdir(dir);
    try {
        for await (const f of walk(".", options)) {
            if (f.isDirectory) {
                continue;
            }
            const contents = await Deno.readFile(f.path);
            let ff = f.path.split(SEP);
            let zz = z;
            while (ff.length > 1) {
                zz = zz.folder(ff.shift());
            }
            zz.addFile(ff[0], contents);
        }
    }
    finally {
        Deno.chdir(cwd);
    }
    return z;
}
export class JSZip {
    _z;
    constructor(z) {
        if (z === undefined) {
            this._z = new _JSZip();
        }
        else {
            this._z = z;
        }
    }
    folder(name) {
        const f = this._z.folder(name);
        return new JSZip(f);
    }
    file(path) {
        const f = this._z.file(path);
        return f;
    }
    addFile(path, content, options) {
        const f = this._z.file(path, content, options);
        return f;
    }
    files() {
        const fs = this._z.files;
        return fs;
    }
    async generateAsync(options) {
        return await this._z.generateAsync(options);
    }
    filter(predicate) {
        return this._z.filter(predicate);
    }
    remove(path) {
        return this._z.remove(path);
    }
    async loadAsync(data, options) {
        return this._z.loadAsync(data, options);
    }
    async writeZip(path) {
        const b = await this.generateAsync({ type: "uint8array" });
        return await Deno.writeFile(path, b);
    }
    async unzip(dir = ".") {
        for (const f of this) {
            const ff = join(dir, f.name);
            if (f.dir) {
                await Deno.mkdir(ff, { recursive: true });
                continue;
            }
            const content = await f.async("uint8array");
            await ensureDir(dirname(ff));
            await Deno.writeFile(ff, content);
        }
    }
    *[Symbol.iterator]() {
        yield* Object.values(this.files());
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibW9kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sTUFBTSxNQUFNLGlDQUFpQyxDQUFDO0FBQ3JELE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSwrQ0FBK0MsQ0FBQztBQUMxRSxPQUFPLEVBQUUsSUFBSSxFQUFlLE1BQU0seUNBQXlDLENBQUM7QUFDNUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLE1BQU0sMENBQTBDLENBQUM7QUFnQjlFLE1BQU0sQ0FBQyxLQUFLLFVBQVUsT0FBTyxDQUFDLElBQVk7SUFDeEMsTUFBTSxDQUFDLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztJQUN0QixNQUFNLE9BQU8sR0FBZSxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdEQsTUFBTSxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzNCLE9BQU8sQ0FBQyxDQUFDO0FBQ1gsQ0FBQztBQVFELE1BQU0sQ0FBQyxLQUFLLFVBQVUsTUFBTSxDQUMxQixHQUFXLEVBQ1gsT0FBcUI7SUFFckIsTUFBTSxDQUFDLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztJQUN0QixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7SUFFdkIsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNoQixJQUFJO1FBQ0YsSUFBSSxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsRUFBRTtZQUN4QyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUU7Z0JBRWpCLFNBQVM7YUFDVjtZQUNELE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7WUFHN0MsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFD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LENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUMxQyxTQUFTO2FBQ1Y7WUFDRCxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDNUMsTUFBTSxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFN0IsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUNuQztJQUNILENBQUM7SUFFRCxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQztRQUNoQixLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQ3JDLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfSlNaaXAgZnJvbSBcImh0dHBzOi8vZGV2LmpzcG0uaW8vanN6aXBAMy41LjBcIjtcbmltcG9ydCB7IGVuc3VyZURpciB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC45My4wL2ZzL2Vuc3VyZV9kaXIudHNcIjtcbmltcG9ydCB7IHdhbGssIFdhbGtPcHRpb25zIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjkzLjAvZnMvd2Fsay50c1wiO1xuaW1wb3J0IHsgZGlybmFtZSwgam9pbiwgU0VQIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjkzLjAvcGF0aC9tb2QudHNcIjtcbmltcG9ydCB7XG4gIElucHV0RmlsZUZvcm1hdCxcbiAgSlNaaXBGaWxlT3B0aW9ucyxcbiAgSlNaaXBHZW5lcmF0b3JPcHRpb25zLFxuICBKU1ppcExvYWRPcHRpb25zLFxuICBKU1ppcE9iamVjdCxcbiAgT3V0cHV0QnlUeXBlLFxufSBmcm9tIFwiLi90eXBlcy50c1wiO1xuXG4vKipcbiAqIFJlYWQgemlwIGZpbGUgYXN5bmNocm9ub3VzbHkgZnJvbSBhIGZpbGVcbiAqXG4gKiBAcGFyYW0gcGF0aCBvZiB6aXAgZmlsZVxuICogQHJldHVybiBSZXR1cm5zIHByb21pc2VcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWRaaXAocGF0aDogc3RyaW5nKTogUHJvbWlzZTxKU1ppcD4ge1xuICBjb25zdCB6ID0gbmV3IEpTWmlwKCk7XG4gIGNvbnN0IGNvbnRlbnQ6IFVpbnQ4QXJyYXkgPSBhd2FpdCBEZW5vLnJlYWRGaWxlKHBhdGgpO1xuICBhd2FpdCB6LmxvYWRBc3luYyhjb250ZW50KTtcbiAgcmV0dXJuIHo7XG59XG5cbi8qKlxuICogUmVhZCBhIGRpcmVjdG9yeSBhcyBhIEpTWmlwXG4gKlxuICogQHBhcmFtIGRpciBkaXJlY3RvcnlcbiAqIEByZXR1cm4gUmV0dXJucyBwcm9taXNlXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB6aXBEaXIoXG4gIGRpcjogc3RyaW5nLFxuICBvcHRpb25zPzogV2Fsa09wdGlvbnMsXG4pOiBQcm9taXNlPEpTWmlwPiB7XG4gIGNvbnN0IHogPSBuZXcgSlNaaXAoKTtcbiAgY29uc3QgY3dkID0gRGVuby5jd2QoKTtcbiAgLy8gRklYTUUgaXQgd291bGQgYmUgbmljZSB0byBkbyB0aGlzIHdpdGhvdXQgY2hkaXIuLi5cbiAgRGVuby5jaGRpcihkaXIpO1xuICB0cnkge1xuICAgIGZvciBhd2FpdCAoY29uc3QgZiBvZiB3YWxrKFwiLlwiLCBvcHRpb25zKSkge1xuICAgICAgaWYgKGYuaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgLy8gc2tpcCBkaXJlY3Rvcmllc1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGNvbnRlbnRzID0gYXdhaXQgRGVuby5yZWFkRmlsZShmLnBhdGgpO1xuXG4gICAgICAvLyBJbiBvcmRlciB0byBzdXBwb3J0IFdpbmRvd3Mgd2UgZG8gdGhpcyByaWRpY3Vsb3VzbmVzcy5cbiAgICAgIGxldCBmZiA9IGYucGF0aC5zcGxpdChTRVApO1xuICAgICAgbGV0IHp6ID0gejtcbiAgICAgIHdoaWxlIChmZi5sZW5ndGggPiAxKSB7XG4gICAgICAgIHp6ID0genouZm9sZGVyKGZmLnNoaWZ0KCkhKTtcbiAgICAgIH1cbiAgICAgIHp6LmFkZEZpbGUoZmZbMF0sIGNvbnRlbnRzKTtcbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgRGVuby5jaGRpcihjd2QpO1xuICB9XG4gIHJldHVybiB6O1xufVxuXG5leHBvcnQgY2xhc3MgSlNaaXAge1xuICBwcm90ZWN0ZWQgX3o6IGFueTtcblxuICAvLyB3ZSBzaG91bGQgYXNzZXJ0IHRoZSB0eXBlICh3ZSB3YW50IGl0IHRvIGJlIGEgX0pTWmlwKSA/XG4gIGNvbnN0cnVjdG9yKHo/OiBhbnkpIHtcbiAgICBpZiAoeiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBAdHMtaWdub3Jlc1xuICAgICAgdGhpcy5feiA9IG5ldyBfSlNaaXAoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5feiA9IHo7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gbmV3IEpTWmlwIGluc3RhbmNlIHdpdGggdGhlIGdpdmVuIGZvbGRlciBhcyByb290XG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIGZvbGRlclxuICAgKiBAcmV0dXJuIE5ldyBKU1ppcCBvYmplY3Qgd2l0aCB0aGUgZ2l2ZW4gZm9sZGVyIGFzIHJvb3Qgb3IgbnVsbFxuICAgKi9cbiAgZm9sZGVyKG5hbWU6IHN0cmluZyk6IEpTWmlwIHtcbiAgICAvLyBAdHMtaWdub3Jlc1xuICAgIGNvbnN0IGYgPSB0aGlzLl96LmZvbGRlcihuYW1lKTtcbiAgICByZXR1cm4gbmV3IEpTWmlwKGYpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGZpbGUgZnJvbSB0aGUgYXJjaGl2ZVxuICAgKlxuICAgKiBAcGFyYW0gUGF0aCByZWxhdGl2ZSBwYXRoIHRvIGZpbGVcbiAgICogQHJldHVybiBGaWxlIG1hdGNoaW5nIHBhdGgsIG51bGwgaWYgbm8gZmlsZSBmb3VuZFxuICAgKi9cbiAgZmlsZShwYXRoOiBzdHJpbmcpOiBKU1ppcE9iamVjdCB7XG4gICAgLy8gQHRzLWlnbm9yZXNcbiAgICBjb25zdCBmID0gdGhpcy5fei5maWxlKHBhdGgpO1xuICAgIHJldHVybiBmIGFzIEpTWmlwT2JqZWN0O1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIGZpbGUgdG8gdGhlIGFyY2hpdmVcbiAgICpcbiAgICogQHBhcmFtIHBhdGggUmVsYXRpdmUgcGF0aCB0byBmaWxlXG4gICAqIEBwYXJhbSBkYXRhIENvbnRlbnQgb2YgdGhlIGZpbGVcbiAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9uYWwgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGZpbGVcbiAgICogQHJldHVybiBKU1ppcCBvYmplY3RcbiAgICovXG4gIGFkZEZpbGUoXG4gICAgcGF0aDogc3RyaW5nLFxuICAgIGNvbnRlbnQ/OiBzdHJpbmcgfCBVaW50OEFycmF5LFxuICAgIG9wdGlvbnM/OiBKU1ppcEZpbGVPcHRpb25zLFxuICApOiBKU1ppcE9iamVjdCB7XG4gICAgLy8gQHRzLWlnbm9yZXNcbiAgICBjb25zdCBmID0gdGhpcy5fei5maWxlKHBhdGgsIGNvbnRlbnQsIG9wdGlvbnMpO1xuICAgIHJldHVybiBmIGFzIEpTWmlwT2JqZWN0O1xuICB9XG5cbiAgZmlsZXMoKTogeyBba2V5OiBzdHJpbmddOiBKU1ppcE9iamVjdCB9IHtcbiAgICAvLyBAdHMtaWdub3Jlc1xuICAgIGNvbnN0IGZzID0gdGhpcy5fei5maWxlcztcbiAgICByZXR1cm4gZnM7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIGEgbmV3IGFyY2hpdmUgYXN5bmNocm9ub3VzbHlcbiAgICpcbiAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9uYWwgb3B0aW9ucyBmb3IgdGhlIGdlbmVyYXRvclxuICAgKiBAcGFyYW0gb25VcGRhdGUgVGhlIG9wdGlvbmFsIGZ1bmN0aW9uIGNhbGxlZCBvbiBlYWNoIGludGVybmFsIHVwZGF0ZSB3aXRoIHRoZSBtZXRhZGF0YS5cbiAgICogQHJldHVybiBUaGUgc2VyaWFsaXplZCBhcmNoaXZlXG4gICAqL1xuICBhc3luYyBnZW5lcmF0ZUFzeW5jPFQgZXh0ZW5kcyBrZXlvZiBPdXRwdXRCeVR5cGU+KFxuICAgIG9wdGlvbnM/OiBKU1ppcEdlbmVyYXRvck9wdGlvbnM8VD4sXG4gICk6IFByb21pc2U8T3V0cHV0QnlUeXBlW1RdPiB7XG4gICAgLy8gQHRzLWlnbm9yZXNcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5fei5nZW5lcmF0ZUFzeW5jKG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbGwgZmlsZXMgd2hpY2ggbWF0Y2ggdGhlIGdpdmVuIGZpbHRlciBmdW5jdGlvblxuICAgKlxuICAgKiBAcGFyYW0gcHJlZGljYXRlIEZpbHRlciBmdW5jdGlvblxuICAgKiBAcmV0dXJuIEFycmF5IG9mIG1hdGNoZWQgZWxlbWVudHNcbiAgICovXG4gIGZpbHRlcihcbiAgICBwcmVkaWNhdGU6IChyZWxhdGl2ZVBhdGg6IHN0cmluZywgZmlsZTogSlNaaXBPYmplY3QpID0+IGJvb2xlYW4sXG4gICk6IEpTWmlwT2JqZWN0W10ge1xuICAgIC8vIEB0cy1pZ25vcmVzXG4gICAgcmV0dXJuIHRoaXMuX3ouZmlsdGVyKHByZWRpY2F0ZSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyB0aGUgZmlsZSBvciBmb2xkZXIgZnJvbSB0aGUgYXJjaGl2ZVxuICAgKlxuICAgKiBAcGFyYW0gcGF0aCBSZWxhdGl2ZSBwYXRoIG9mIGZpbGUgb3IgZm9sZGVyXG4gICAqIEByZXR1cm4gUmV0dXJucyB0aGUgSlNaaXAgaW5zdGFuY2VcbiAgICovXG4gIHJlbW92ZShwYXRoOiBzdHJpbmcpOiBKU1ppcCB7XG4gICAgLy8gQHRzLWlnbm9yZXNcbiAgICByZXR1cm4gdGhpcy5fei5yZW1vdmUocGF0aCk7XG4gIH1cblxuICAvKipcbiAgICogRGVzZXJpYWxpemUgemlwIGZpbGUgYXN5bmNocm9ub3VzbHlcbiAgICpcbiAgICogQHBhcmFtIGRhdGEgU2VyaWFsaXplZCB6aXAgZmlsZVxuICAgKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIGZvciBkZXNlcmlhbGl6aW5nXG4gICAqIEByZXR1cm4gUmV0dXJucyBwcm9taXNlXG4gICAqL1xuICBhc3luYyBsb2FkQXN5bmMoXG4gICAgZGF0YTogSW5wdXRGaWxlRm9ybWF0LFxuICAgIG9wdGlvbnM/OiBKU1ppcExvYWRPcHRpb25zLFxuICApOiBQcm9taXNlPEpTWmlwPiB7XG4gICAgcmV0dXJuIHRoaXMuX3oubG9hZEFzeW5jKGRhdGEsIG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFdyaXRlIHppcCBmaWxlIGFzeW5jaHJvbm91c2x5IHRvIGEgZmlsZVxuICAgKlxuICAgKiBAcGFyYW0gcGF0aCBvZiB6aXAgZmlsZVxuICAgKiBAcmV0dXJuIFJldHVybnMgcHJvbWlzZVxuICAgKi9cbiAgYXN5bmMgd3JpdGVaaXAocGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgYjogVWludDhBcnJheSA9IGF3YWl0IHRoaXMuZ2VuZXJhdGVBc3luYyh7IHR5cGU6IFwidWludDhhcnJheVwiIH0pO1xuICAgIHJldHVybiBhd2FpdCBEZW5vLndyaXRlRmlsZShwYXRoLCBiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVbnppcCBhIEpTWmlwIGFzeW5jaHJvbm91c2x5IHRvIGEgZGlyZWN0b3J5XG4gICAqXG4gICAqIEBwYXJhbSBkaXIgdG8gdW56aXAgaW50b1xuICAgKiBAcmV0dXJuIFJldHVybnMgcHJvbWlzZVxuICAgKi9cbiAgYXN5bmMgdW56aXAoZGlyOiBzdHJpbmcgPSBcIi5cIik6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIEZJWE1FIG9wdGlvbmFsbHkgcmVwbGFjZSB0aGUgZXhpc3RpbmcgZm9sZGVyIHByZWZpeCB3aXRoIGRpci5cbiAgICBmb3IgKGNvbnN0IGYgb2YgdGhpcykge1xuICAgICAgY29uc3QgZmYgPSBqb2luKGRpciwgZi5uYW1lKTtcbiAgICAgIGlmIChmLmRpcikge1xuICAgICAgICBhd2FpdCBEZW5vLm1rZGlyKGZmLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgZi5hc3luYyhcInVpbnQ4YXJyYXlcIik7XG4gICAgICBhd2FpdCBlbnN1cmVEaXIoZGlybmFtZShmZikpO1xuICAgICAgLy8gVE9ETyBwYXNzIFdyaXRlRmlsZU9wdGlvbnMgZS5nLiBtb2RlXG4gICAgICBhd2FpdCBEZW5vLndyaXRlRmlsZShmZiwgY29udGVudCk7XG4gICAgfVxuICB9XG5cbiAgKltTeW1ib2wuaXRlcmF0b3JdKCk6IEl0ZXJhdG9yPEpTWmlwT2JqZWN0PiB7XG4gICAgeWllbGQqIE9iamVjdC52YWx1ZXModGhpcy5maWxlcygpKTtcbiAgfVxufVxuIl19
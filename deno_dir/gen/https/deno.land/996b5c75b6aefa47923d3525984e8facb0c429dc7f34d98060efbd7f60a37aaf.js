import { exists, existsSync } from "./exists.ts";
import { isSubdir } from "./_util.ts";
export async function move(src, dest, { overwrite = false } = {}) {
    const srcStat = await Deno.stat(src);
    if (srcStat.isDirectory && isSubdir(src, dest)) {
        throw new Error(`Cannot move '${src}' to a subdirectory of itself, '${dest}'.`);
    }
    if (overwrite) {
        if (await exists(dest)) {
            await Deno.remove(dest, { recursive: true });
        }
    }
    else {
        if (await exists(dest)) {
            throw new Error("dest already exists.");
        }
    }
    await Deno.rename(src, dest);
    return;
}
export function moveSync(src, dest, { overwrite = false } = {}) {
    const srcStat = Deno.statSync(src);
    if (srcStat.isDirectory && isSubdir(src, dest)) {
        throw new Error(`Cannot move '${src}' to a subdirectory of itself, '${dest}'.`);
    }
    if (overwrite) {
        if (existsSync(dest)) {
            Deno.removeSync(dest, { recursive: true });
        }
    }
    else {
        if (existsSync(dest)) {
            throw new Error("dest already exists.");
        }
    }
    Deno.renameSync(src, dest);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW92ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1vdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDakQsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLFlBQVksQ0FBQztBQU90QyxNQUFNLENBQUMsS0FBSyxVQUFVLElBQUksQ0FDeEIsR0FBVyxFQUNYLElBQVksRUFDWixFQUFFLFNBQVMsR0FBRyxLQUFLLEtBQWtCLEVBQUU7SUFFdkMsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBRXJDLElBQUksT0FBTyxDQUFDLFdBQVcsSUFBSSxRQUFRLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxFQUFFO1FBQzlDLE1BQU0sSUFBSSxLQUFLLENBQ2IsZ0JBQWdCLEdBQUcsbUNBQW1DLElBQUksSUFBSSxDQUMvRCxDQUFDO0tBQ0g7SUFFRCxJQUFJLFNBQVMsRUFBRTtRQUNiLElBQUksTUFBTSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDdEIsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1NBQzlDO0tBQ0Y7U0FBTTtRQUNMLElBQUksTUFBTSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDdEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1NBQ3pDO0tBQ0Y7SUFFRCxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBRTdCLE9BQU87QUFDVCxDQUFDO0FBR0QsTUFBTSxVQUFVLFFBQVEsQ0FDdEIsR0FBVyxFQUNYLElBQVksRUFDWixFQUFFLFNBQVMsR0FBRyxLQUFLLEtBQWtCLEVBQUU7SUFFdkMsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUVuQyxJQUFJLE9BQU8sQ0FBQyxXQUFXLElBQUksUUFBUSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsRUFBRTtRQUM5QyxNQUFNLElBQUksS0FBSyxDQUNiLGdCQUFnQixHQUFHLG1DQUFtQyxJQUFJLElBQUksQ0FDL0QsQ0FBQztLQUNIO0lBRUQsSUFBSSxTQUFTLEVBQUU7UUFDYixJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNwQixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1NBQzVDO0tBQ0Y7U0FBTTtRQUNMLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3BCLE1BQU0sSUFBSSxLQUFLLENBQUMsc0JBQXNCLENBQUMsQ0FBQztTQUN6QztLQUNGO0lBRUQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDN0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjEgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5pbXBvcnQgeyBleGlzdHMsIGV4aXN0c1N5bmMgfSBmcm9tIFwiLi9leGlzdHMudHNcIjtcbmltcG9ydCB7IGlzU3ViZGlyIH0gZnJvbSBcIi4vX3V0aWwudHNcIjtcblxuaW50ZXJmYWNlIE1vdmVPcHRpb25zIHtcbiAgb3ZlcndyaXRlPzogYm9vbGVhbjtcbn1cblxuLyoqIE1vdmVzIGEgZmlsZSBvciBkaXJlY3RvcnkgKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtb3ZlKFxuICBzcmM6IHN0cmluZyxcbiAgZGVzdDogc3RyaW5nLFxuICB7IG92ZXJ3cml0ZSA9IGZhbHNlIH06IE1vdmVPcHRpb25zID0ge30sXG4pIHtcbiAgY29uc3Qgc3JjU3RhdCA9IGF3YWl0IERlbm8uc3RhdChzcmMpO1xuXG4gIGlmIChzcmNTdGF0LmlzRGlyZWN0b3J5ICYmIGlzU3ViZGlyKHNyYywgZGVzdCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgQ2Fubm90IG1vdmUgJyR7c3JjfScgdG8gYSBzdWJkaXJlY3Rvcnkgb2YgaXRzZWxmLCAnJHtkZXN0fScuYCxcbiAgICApO1xuICB9XG5cbiAgaWYgKG92ZXJ3cml0ZSkge1xuICAgIGlmIChhd2FpdCBleGlzdHMoZGVzdCkpIHtcbiAgICAgIGF3YWl0IERlbm8ucmVtb3ZlKGRlc3QsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoYXdhaXQgZXhpc3RzKGRlc3QpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJkZXN0IGFscmVhZHkgZXhpc3RzLlwiKTtcbiAgICB9XG4gIH1cblxuICBhd2FpdCBEZW5vLnJlbmFtZShzcmMsIGRlc3QpO1xuXG4gIHJldHVybjtcbn1cblxuLyoqIE1vdmVzIGEgZmlsZSBvciBkaXJlY3Rvcnkgc3luY2hyb25vdXNseSAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1vdmVTeW5jKFxuICBzcmM6IHN0cmluZyxcbiAgZGVzdDogc3RyaW5nLFxuICB7IG92ZXJ3cml0ZSA9IGZhbHNlIH06IE1vdmVPcHRpb25zID0ge30sXG4pOiB2b2lkIHtcbiAgY29uc3Qgc3JjU3RhdCA9IERlbm8uc3RhdFN5bmMoc3JjKTtcblxuICBpZiAoc3JjU3RhdC5pc0RpcmVjdG9yeSAmJiBpc1N1YmRpcihzcmMsIGRlc3QpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYENhbm5vdCBtb3ZlICcke3NyY30nIHRvIGEgc3ViZGlyZWN0b3J5IG9mIGl0c2VsZiwgJyR7ZGVzdH0nLmAsXG4gICAgKTtcbiAgfVxuXG4gIGlmIChvdmVyd3JpdGUpIHtcbiAgICBpZiAoZXhpc3RzU3luYyhkZXN0KSkge1xuICAgICAgRGVuby5yZW1vdmVTeW5jKGRlc3QsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZXhpc3RzU3luYyhkZXN0KSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZGVzdCBhbHJlYWR5IGV4aXN0cy5cIik7XG4gICAgfVxuICB9XG5cbiAgRGVuby5yZW5hbWVTeW5jKHNyYywgZGVzdCk7XG59XG4iXX0=
import { repeat } from "./utils.ts";
export class Mark {
    name;
    buffer;
    position;
    line;
    column;
    constructor(name, buffer, position, line, column) {
        this.name = name;
        this.buffer = buffer;
        this.position = position;
        this.line = line;
        this.column = column;
    }
    getSnippet(indent = 4, maxLength = 75) {
        if (!this.buffer)
            return null;
        let head = "";
        let start = this.position;
        while (start > 0 &&
            "\x00\r\n\x85\u2028\u2029".indexOf(this.buffer.charAt(start - 1)) === -1) {
            start -= 1;
            if (this.position - start > maxLength / 2 - 1) {
                head = " ... ";
                start += 5;
                break;
            }
        }
        let tail = "";
        let end = this.position;
        while (end < this.buffer.length &&
            "\x00\r\n\x85\u2028\u2029".indexOf(this.buffer.charAt(end)) === -1) {
            end += 1;
            if (end - this.position > maxLength / 2 - 1) {
                tail = " ... ";
                end -= 5;
                break;
            }
        }
        const snippet = this.buffer.slice(start, end);
        return `${repeat(" ", indent)}${head}${snippet}${tail}\n${repeat(" ", indent + this.position - start + head.length)}^`;
    }
    toString(compact) {
        let snippet, where = "";
        if (this.name) {
            where += `in "${this.name}" `;
        }
        where += `at line ${this.line + 1}, column ${this.column + 1}`;
        if (!compact) {
            snippet = this.getSnippet();
            if (snippet) {
                where += `:\n${snippet}`;
            }
        }
        return where;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFyay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1hcmsudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBS0EsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLFlBQVksQ0FBQztBQUVwQyxNQUFNLE9BQU8sSUFBSTtJQUVOO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFMVCxZQUNTLElBQVksRUFDWixNQUFjLEVBQ2QsUUFBZ0IsRUFDaEIsSUFBWSxFQUNaLE1BQWM7UUFKZCxTQUFJLEdBQUosSUFBSSxDQUFRO1FBQ1osV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQUNkLGFBQVEsR0FBUixRQUFRLENBQVE7UUFDaEIsU0FBSSxHQUFKLElBQUksQ0FBUTtRQUNaLFdBQU0sR0FBTixNQUFNLENBQVE7SUFDcEIsQ0FBQztJQUVHLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLFNBQVMsR0FBRyxFQUFFO1FBQzFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTTtZQUFFLE9BQU8sSUFBSSxDQUFDO1FBRTlCLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNkLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7UUFFMUIsT0FDRSxLQUFLLEdBQUcsQ0FBQztZQUNULDBCQUEwQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFDeEU7WUFDQSxLQUFLLElBQUksQ0FBQyxDQUFDO1lBQ1gsSUFBSSxJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssR0FBRyxTQUFTLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDN0MsSUFBSSxHQUFHLE9BQU8sQ0FBQztnQkFDZixLQUFLLElBQUksQ0FBQyxDQUFDO2dCQUNYLE1BQU07YUFDUDtTQUNGO1FBRUQsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ2QsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUV4QixPQUNFLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU07WUFDeEIsMEJBQTBCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQ2xFO1lBQ0EsR0FBRyxJQUFJLENBQUMsQ0FBQztZQUNULElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxRQUFRLEdBQUcsU0FBUyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQzNDLElBQUksR0FBRyxPQUFPLENBQUM7Z0JBQ2YsR0FBRyxJQUFJLENBQUMsQ0FBQztnQkFDVCxNQUFNO2FBQ1A7U0FDRjtRQUVELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztRQUM5QyxPQUFPLEdBQUcsTUFBTSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsR0FBRyxJQUFJLEdBQUcsT0FBTyxHQUFHLElBQUksS0FDbkQsTUFBTSxDQUNKLEdBQUcsRUFDSCxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FFaEQsR0FBRyxDQUFDO0lBQ04sQ0FBQztJQUVNLFFBQVEsQ0FBQyxPQUFpQjtRQUMvQixJQUFJLE9BQU8sRUFDVCxLQUFLLEdBQUcsRUFBRSxDQUFDO1FBRWIsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ2IsS0FBSyxJQUFJLE9BQU8sSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDO1NBQy9CO1FBRUQsS0FBSyxJQUFJLFdBQVcsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLFlBQVksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUUvRCxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ1osT0FBTyxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUU1QixJQUFJLE9BQU8sRUFBRTtnQkFDWCxLQUFLLElBQUksTUFBTSxPQUFPLEVBQUUsQ0FBQzthQUMxQjtTQUNGO1FBRUQsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBQb3J0ZWQgZnJvbSBqcy15YW1sIHYzLjEzLjE6XG4vLyBodHRwczovL2dpdGh1Yi5jb20vbm9kZWNhL2pzLXlhbWwvY29tbWl0LzY2NWFhZGRhNDIzNDlkY2FlODY5ZjEyMDQwZDliMTBlZjE4ZDEyZGFcbi8vIENvcHlyaWdodCAyMDExLTIwMTUgYnkgVml0YWx5IFB1enJpbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBDb3B5cmlnaHQgMjAxOC0yMDIxIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuXG5pbXBvcnQgeyByZXBlYXQgfSBmcm9tIFwiLi91dGlscy50c1wiO1xuXG5leHBvcnQgY2xhc3MgTWFyayB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyBuYW1lOiBzdHJpbmcsXG4gICAgcHVibGljIGJ1ZmZlcjogc3RyaW5nLFxuICAgIHB1YmxpYyBwb3NpdGlvbjogbnVtYmVyLFxuICAgIHB1YmxpYyBsaW5lOiBudW1iZXIsXG4gICAgcHVibGljIGNvbHVtbjogbnVtYmVyLFxuICApIHt9XG5cbiAgcHVibGljIGdldFNuaXBwZXQoaW5kZW50ID0gNCwgbWF4TGVuZ3RoID0gNzUpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBpZiAoIXRoaXMuYnVmZmVyKSByZXR1cm4gbnVsbDtcblxuICAgIGxldCBoZWFkID0gXCJcIjtcbiAgICBsZXQgc3RhcnQgPSB0aGlzLnBvc2l0aW9uO1xuXG4gICAgd2hpbGUgKFxuICAgICAgc3RhcnQgPiAwICYmXG4gICAgICBcIlxceDAwXFxyXFxuXFx4ODVcXHUyMDI4XFx1MjAyOVwiLmluZGV4T2YodGhpcy5idWZmZXIuY2hhckF0KHN0YXJ0IC0gMSkpID09PSAtMVxuICAgICkge1xuICAgICAgc3RhcnQgLT0gMTtcbiAgICAgIGlmICh0aGlzLnBvc2l0aW9uIC0gc3RhcnQgPiBtYXhMZW5ndGggLyAyIC0gMSkge1xuICAgICAgICBoZWFkID0gXCIgLi4uIFwiO1xuICAgICAgICBzdGFydCArPSA1O1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgdGFpbCA9IFwiXCI7XG4gICAgbGV0IGVuZCA9IHRoaXMucG9zaXRpb247XG5cbiAgICB3aGlsZSAoXG4gICAgICBlbmQgPCB0aGlzLmJ1ZmZlci5sZW5ndGggJiZcbiAgICAgIFwiXFx4MDBcXHJcXG5cXHg4NVxcdTIwMjhcXHUyMDI5XCIuaW5kZXhPZih0aGlzLmJ1ZmZlci5jaGFyQXQoZW5kKSkgPT09IC0xXG4gICAgKSB7XG4gICAgICBlbmQgKz0gMTtcbiAgICAgIGlmIChlbmQgLSB0aGlzLnBvc2l0aW9uID4gbWF4TGVuZ3RoIC8gMiAtIDEpIHtcbiAgICAgICAgdGFpbCA9IFwiIC4uLiBcIjtcbiAgICAgICAgZW5kIC09IDU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHNuaXBwZXQgPSB0aGlzLmJ1ZmZlci5zbGljZShzdGFydCwgZW5kKTtcbiAgICByZXR1cm4gYCR7cmVwZWF0KFwiIFwiLCBpbmRlbnQpfSR7aGVhZH0ke3NuaXBwZXR9JHt0YWlsfVxcbiR7XG4gICAgICByZXBlYXQoXG4gICAgICAgIFwiIFwiLFxuICAgICAgICBpbmRlbnQgKyB0aGlzLnBvc2l0aW9uIC0gc3RhcnQgKyBoZWFkLmxlbmd0aCxcbiAgICAgIClcbiAgICB9XmA7XG4gIH1cblxuICBwdWJsaWMgdG9TdHJpbmcoY29tcGFjdD86IGJvb2xlYW4pOiBzdHJpbmcge1xuICAgIGxldCBzbmlwcGV0LFxuICAgICAgd2hlcmUgPSBcIlwiO1xuXG4gICAgaWYgKHRoaXMubmFtZSkge1xuICAgICAgd2hlcmUgKz0gYGluIFwiJHt0aGlzLm5hbWV9XCIgYDtcbiAgICB9XG5cbiAgICB3aGVyZSArPSBgYXQgbGluZSAke3RoaXMubGluZSArIDF9LCBjb2x1bW4gJHt0aGlzLmNvbHVtbiArIDF9YDtcblxuICAgIGlmICghY29tcGFjdCkge1xuICAgICAgc25pcHBldCA9IHRoaXMuZ2V0U25pcHBldCgpO1xuXG4gICAgICBpZiAoc25pcHBldCkge1xuICAgICAgICB3aGVyZSArPSBgOlxcbiR7c25pcHBldH1gO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB3aGVyZTtcbiAgfVxufVxuIl19
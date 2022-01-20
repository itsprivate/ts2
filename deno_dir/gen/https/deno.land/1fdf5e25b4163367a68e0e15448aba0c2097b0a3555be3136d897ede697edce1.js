import * as winErrors from "./_winerror.ts";
export function uvTranslateSysError(sysErrno) {
    switch (sysErrno) {
        case winErrors.ERROR_ACCESS_DENIED:
            return "EACCES";
        case winErrors.ERROR_NOACCESS:
            return "EACCES";
        case winErrors.WSAEACCES:
            return "EACCES";
        case winErrors.ERROR_CANT_ACCESS_FILE:
            return "EACCES";
        case winErrors.ERROR_ADDRESS_ALREADY_ASSOCIATED:
            return "EADDRINUSE";
        case winErrors.WSAEADDRINUSE:
            return "EADDRINUSE";
        case winErrors.WSAEADDRNOTAVAIL:
            return "EADDRNOTAVAIL";
        case winErrors.WSAEAFNOSUPPORT:
            return "EAFNOSUPPORT";
        case winErrors.WSAEWOULDBLOCK:
            return "EAGAIN";
        case winErrors.WSAEALREADY:
            return "EALREADY";
        case winErrors.ERROR_INVALID_FLAGS:
            return "EBADF";
        case winErrors.ERROR_INVALID_HANDLE:
            return "EBADF";
        case winErrors.ERROR_LOCK_VIOLATION:
            return "EBUSY";
        case winErrors.ERROR_PIPE_BUSY:
            return "EBUSY";
        case winErrors.ERROR_SHARING_VIOLATION:
            return "EBUSY";
        case winErrors.ERROR_OPERATION_ABORTED:
            return "ECANCELED";
        case winErrors.WSAEINTR:
            return "ECANCELED";
        case winErrors.ERROR_NO_UNICODE_TRANSLATION:
            return "ECHARSET";
        case winErrors.ERROR_CONNECTION_ABORTED:
            return "ECONNABORTED";
        case winErrors.WSAECONNABORTED:
            return "ECONNABORTED";
        case winErrors.ERROR_CONNECTION_REFUSED:
            return "ECONNREFUSED";
        case winErrors.WSAECONNREFUSED:
            return "ECONNREFUSED";
        case winErrors.ERROR_NETNAME_DELETED:
            return "ECONNRESET";
        case winErrors.WSAECONNRESET:
            return "ECONNRESET";
        case winErrors.ERROR_ALREADY_EXISTS:
            return "EEXIST";
        case winErrors.ERROR_FILE_EXISTS:
            return "EEXIST";
        case winErrors.ERROR_BUFFER_OVERFLOW:
            return "EFAULT";
        case winErrors.WSAEFAULT:
            return "EFAULT";
        case winErrors.ERROR_HOST_UNREACHABLE:
            return "EHOSTUNREACH";
        case winErrors.WSAEHOSTUNREACH:
            return "EHOSTUNREACH";
        case winErrors.ERROR_INSUFFICIENT_BUFFER:
            return "EINVAL";
        case winErrors.ERROR_INVALID_DATA:
            return "EINVAL";
        case winErrors.ERROR_INVALID_NAME:
            return "EINVAL";
        case winErrors.ERROR_INVALID_PARAMETER:
            return "EINVAL";
        case winErrors.WSAEINVAL:
            return "EINVAL";
        case winErrors.WSAEPFNOSUPPORT:
            return "EINVAL";
        case winErrors.ERROR_BEGINNING_OF_MEDIA:
            return "EIO";
        case winErrors.ERROR_BUS_RESET:
            return "EIO";
        case winErrors.ERROR_CRC:
            return "EIO";
        case winErrors.ERROR_DEVICE_DOOR_OPEN:
            return "EIO";
        case winErrors.ERROR_DEVICE_REQUIRES_CLEANING:
            return "EIO";
        case winErrors.ERROR_DISK_CORRUPT:
            return "EIO";
        case winErrors.ERROR_EOM_OVERFLOW:
            return "EIO";
        case winErrors.ERROR_FILEMARK_DETECTED:
            return "EIO";
        case winErrors.ERROR_GEN_FAILURE:
            return "EIO";
        case winErrors.ERROR_INVALID_BLOCK_LENGTH:
            return "EIO";
        case winErrors.ERROR_IO_DEVICE:
            return "EIO";
        case winErrors.ERROR_NO_DATA_DETECTED:
            return "EIO";
        case winErrors.ERROR_NO_SIGNAL_SENT:
            return "EIO";
        case winErrors.ERROR_OPEN_FAILED:
            return "EIO";
        case winErrors.ERROR_SETMARK_DETECTED:
            return "EIO";
        case winErrors.ERROR_SIGNAL_REFUSED:
            return "EIO";
        case winErrors.WSAEISCONN:
            return "EISCONN";
        case winErrors.ERROR_CANT_RESOLVE_FILENAME:
            return "ELOOP";
        case winErrors.ERROR_TOO_MANY_OPEN_FILES:
            return "EMFILE";
        case winErrors.WSAEMFILE:
            return "EMFILE";
        case winErrors.WSAEMSGSIZE:
            return "EMSGSIZE";
        case winErrors.ERROR_FILENAME_EXCED_RANGE:
            return "ENAMETOOLONG";
        case winErrors.ERROR_NETWORK_UNREACHABLE:
            return "ENETUNREACH";
        case winErrors.WSAENETUNREACH:
            return "ENETUNREACH";
        case winErrors.WSAENOBUFS:
            return "ENOBUFS";
        case winErrors.ERROR_BAD_PATHNAME:
            return "ENOENT";
        case winErrors.ERROR_DIRECTORY:
            return "ENOTDIR";
        case winErrors.ERROR_ENVVAR_NOT_FOUND:
            return "ENOENT";
        case winErrors.ERROR_FILE_NOT_FOUND:
            return "ENOENT";
        case winErrors.ERROR_INVALID_DRIVE:
            return "ENOENT";
        case winErrors.ERROR_INVALID_REPARSE_DATA:
            return "ENOENT";
        case winErrors.ERROR_MOD_NOT_FOUND:
            return "ENOENT";
        case winErrors.ERROR_PATH_NOT_FOUND:
            return "ENOENT";
        case winErrors.WSAHOST_NOT_FOUND:
            return "ENOENT";
        case winErrors.WSANO_DATA:
            return "ENOENT";
        case winErrors.ERROR_NOT_ENOUGH_MEMORY:
            return "ENOMEM";
        case winErrors.ERROR_OUTOFMEMORY:
            return "ENOMEM";
        case winErrors.ERROR_CANNOT_MAKE:
            return "ENOSPC";
        case winErrors.ERROR_DISK_FULL:
            return "ENOSPC";
        case winErrors.ERROR_EA_TABLE_FULL:
            return "ENOSPC";
        case winErrors.ERROR_END_OF_MEDIA:
            return "ENOSPC";
        case winErrors.ERROR_HANDLE_DISK_FULL:
            return "ENOSPC";
        case winErrors.ERROR_NOT_CONNECTED:
            return "ENOTCONN";
        case winErrors.WSAENOTCONN:
            return "ENOTCONN";
        case winErrors.ERROR_DIR_NOT_EMPTY:
            return "ENOTEMPTY";
        case winErrors.WSAENOTSOCK:
            return "ENOTSOCK";
        case winErrors.ERROR_NOT_SUPPORTED:
            return "ENOTSUP";
        case winErrors.ERROR_BROKEN_PIPE:
            return "EOF";
        case winErrors.ERROR_PRIVILEGE_NOT_HELD:
            return "EPERM";
        case winErrors.ERROR_BAD_PIPE:
            return "EPIPE";
        case winErrors.ERROR_NO_DATA:
            return "EPIPE";
        case winErrors.ERROR_PIPE_NOT_CONNECTED:
            return "EPIPE";
        case winErrors.WSAESHUTDOWN:
            return "EPIPE";
        case winErrors.WSAEPROTONOSUPPORT:
            return "EPROTONOSUPPORT";
        case winErrors.ERROR_WRITE_PROTECT:
            return "EROFS";
        case winErrors.ERROR_SEM_TIMEOUT:
            return "ETIMEDOUT";
        case winErrors.WSAETIMEDOUT:
            return "ETIMEDOUT";
        case winErrors.ERROR_NOT_SAME_DEVICE:
            return "EXDEV";
        case winErrors.ERROR_INVALID_FUNCTION:
            return "EISDIR";
        case winErrors.ERROR_META_EXPANSION_TOO_LONG:
            return "E2BIG";
        case winErrors.WSAESOCKTNOSUPPORT:
            return "ESOCKTNOSUPPORT";
        default:
            return "UNKNOWN";
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX2xpYnV2X3dpbmVycm9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiX2xpYnV2X3dpbmVycm9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQXdCQSxPQUFPLEtBQUssU0FBUyxNQUFNLGdCQUFnQixDQUFDO0FBRTVDLE1BQU0sVUFBVSxtQkFBbUIsQ0FBQyxRQUFnQjtJQUNsRCxRQUFRLFFBQVEsRUFBRTtRQUNoQixLQUFLLFNBQVMsQ0FBQyxtQkFBbUI7WUFDaEMsT0FBTyxRQUFRLENBQUM7UUFDbEIsS0FBSyxTQUFTLENBQUMsY0FBYztZQUMzQixPQUFPLFFBQVEsQ0FBQztRQUNsQixLQUFLLFNBQVMsQ0FBQyxTQUFTO1lBQ3RCLE9BQU8sUUFBUSxDQUFDO1FBRWxCLEtBQUssU0FBUyxDQUFDLHNCQUFzQjtZQUNuQyxPQUFPLFFBQVEsQ0FBQztRQUNsQixLQUFLLFNBQVMsQ0FBQyxnQ0FBZ0M7WUFDN0MsT0FBTyxZQUFZLENBQUM7UUFDdEIsS0FBSyxTQUFTLENBQUMsYUFBYTtZQUMxQixPQUFPLFlBQVksQ0FBQztRQUN0QixLQUFLLFNBQVMsQ0FBQyxnQkFBZ0I7WUFDN0IsT0FBTyxlQUFlLENBQUM7UUFDekIsS0FBSyxTQUFTLENBQUMsZUFBZTtZQUM1QixPQUFPLGNBQWMsQ0FBQztRQUN4QixLQUFLLFNBQVMsQ0FBQyxjQUFjO1lBQzNCLE9BQU8sUUFBUSxDQUFDO1FBQ2xCLEtBQUssU0FBUyxDQUFDLFdBQVc7WUFDeEIsT0FBTyxVQUFVLENBQUM7UUFDcEIsS0FBSyxTQUFTLENBQUMsbUJBQW1CO1lBQ2hDLE9BQU8sT0FBTyxDQUFDO1FBQ2pCLEtBQUssU0FBUyxDQUFDLG9CQUFvQjtZQUNqQyxPQUFPLE9BQU8sQ0FBQztRQUNqQixLQUFLLFNBQVMsQ0FBQyxvQkFBb0I7WUFDakMsT0FBTyxPQUFPLENBQUM7UUFDakIsS0FBSyxTQUFTLENBQUMsZUFBZTtZQUM1QixPQUFPLE9BQU8sQ0FBQztRQUNqQixLQUFLLFNBQVMsQ0FBQyx1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QUFTLENBQUMsa0JBQWtCO1lBQy9CLE9BQU8saUJBQWlCLENBQUM7UUFDM0IsS0FBSyxTQUFTLENBQUMsbUJBQW1CO1lBQ2hDLE9BQU8sT0FBTyxDQUFDO1FBQ2pCLEtBQUssU0FBUyxDQUFDLGlCQUFpQjtZQUM5QixPQUFPLFdBQVcsQ0FBQztRQUNyQixLQUFLLFNBQVMsQ0FBQyxZQUFZO1lBQ3pCLE9BQU8sV0FBVyxDQUFDO1FBQ3JCLEtBQUssU0FBUyxDQUFDLHFCQUFxQjtZQUNsQyxPQUFPLE9BQU8sQ0FBQztRQUNqQixLQUFLLFNBQVMsQ0FBQyxzQkFBc0I7WUFDbkMsT0FBTyxRQUFRLENBQUM7UUFDbEIsS0FBSyxTQUFTLENBQUMsNkJBQTZCO1lBQzFDLE9BQU8sT0FBTyxDQUFDO1FBQ2pCLEtBQUssU0FBUyxDQUFDLGtCQUFrQjtZQUMvQixPQUFPLGlCQUFpQixDQUFDO1FBQzNCO1lBQ0UsT0FBTyxTQUFTLENBQUM7S0FDcEI7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyogQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG9cbiAqIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlXG4gKiByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3JcbiAqIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkdcbiAqIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1NcbiAqIElOIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4vLyBUaGlzIG1vZHVsZSBwb3J0czpcbi8vIC0gaHR0cHM6Ly9naXRodWIuY29tL2xpYnV2L2xpYnV2L2Jsb2IvbWFzdGVyL3NyYy93aW4vZXJyb3IuY1xuXG5pbXBvcnQgKiBhcyB3aW5FcnJvcnMgZnJvbSBcIi4vX3dpbmVycm9yLnRzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiB1dlRyYW5zbGF0ZVN5c0Vycm9yKHN5c0Vycm5vOiBudW1iZXIpOiBzdHJpbmcge1xuICBzd2l0Y2ggKHN5c0Vycm5vKSB7XG4gICAgY2FzZSB3aW5FcnJvcnMuRVJST1JfQUNDRVNTX0RFTklFRDpcbiAgICAgIHJldHVybiBcIkVBQ0NFU1wiO1xuICAgIGNhc2Ugd2luRXJyb3JzLkVSUk9SX05PQUNDRVNTOlxuICAgICAgcmV0dXJuIFwiRUFDQ0VTXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuV1NBRUFDQ0VTOlxuICAgICAgcmV0dXJuIFwiRUFDQ0VTXCI7XG4gICAgLy8gY2FzZSB3aW5FcnJvcnMuRVJST1JfRUxFVkFUSU9OX1JFUVVJUkVEOiAgICAgICAgICByZXR1cm4gXCJFQUNDRVNcIjtcbiAgICBjYXNlIHdpbkVycm9ycy5FUlJPUl9DQU5UX0FDQ0VTU19GSUxFOlxuICAgICAgcmV0dXJuIFwiRUFDQ0VTXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuRVJST1JfQUREUkVTU19BTFJFQURZX0FTU09DSUFURUQ6XG4gICAgICByZXR1cm4gXCJFQUREUklOVVNFXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuV1NBRUFERFJJTlVTRTpcbiAgICAgIHJldHVybiBcIkVBRERSSU5VU0VcIjtcbiAgICBjYXNlIHdpbkVycm9ycy5XU0FFQUREUk5PVEFWQUlMOlxuICAgICAgcmV0dXJuIFwiRUFERFJOT1RBVkFJTFwiO1xuICAgIGNhc2Ugd2luRXJyb3JzLldTQUVBRk5PU1VQUE9SVDpcbiAgICAgIHJldHVybiBcIkVBRk5PU1VQUE9SVFwiO1xuICAgIGNhc2Ugd2luRXJyb3JzLldTQUVXT1VMREJMT0NLOlxuICAgICAgcmV0dXJuIFwiRUFHQUlOXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuV1NBRUFMUkVBRFk6XG4gICAgICByZXR1cm4gXCJFQUxSRUFEWVwiO1xuICAgIGNhc2Ugd2luRXJyb3JzLkVSUk9SX0lOVkFMSURfRkxBR1M6XG4gICAgICByZXR1cm4gXCJFQkFERlwiO1xuICAgIGNhc2Ugd2luRXJyb3JzLkVSUk9SX0lOVkFMSURfSEFORExFOlxuICAgICAgcmV0dXJuIFwiRUJBREZcIjtcbiAgICBjYXNlIHdpbkVycm9ycy5FUlJPUl9MT0NLX1ZJT0xBVElPTjpcbiAgICAgIHJldHVybiBcIkVCVVNZXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuRVJST1JfUElQRV9CVVNZOlxuICAgICAgcmV0dXJuIFwiRUJVU1lcIjtcbiAgICBjYXNlIHdpbkVycm9ycy5FUlJPUl9TSEFSSU5HX1ZJT0xBVElPTjpcbiAgICAgIHJldHVybiBcIkVCVVNZXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuRVJST1JfT1BFUkFUSU9OX0FCT1JURUQ6XG4gICAgICByZXR1cm4gXCJFQ0FOQ0VMRURcIjtcbiAgICBjYXNlIHdpbkVycm9ycy5XU0FFSU5UUjpcbiAgICAgIHJldHVybiBcIkVDQU5DRUxFRFwiO1xuICAgIGNhc2Ugd2luRXJyb3JzLkVSUk9SX05PX1VOSUNPREVfVFJBTlNMQVRJT046XG4gICAgICByZXR1cm4gXCJFQ0hBUlNFVFwiO1xuICAgIGNhc2Ugd2luRXJyb3JzLkVSUk9SX0NPTk5FQ1RJT05fQUJPUlRFRDpcbiAgICAgIHJldHVybiBcIkVDT05OQUJPUlRFRFwiO1xuICAgIGNhc2Ugd2luRXJyb3JzLldTQUVDT05OQUJPUlRFRDpcbiAgICAgIHJldHVybiBcIkVDT05OQUJPUlRFRFwiO1xuICAgIGNhc2Ugd2luRXJyb3JzLkVSUk9SX0NPTk5FQ1RJT05fUkVGVVNFRDpcbiAgICAgIHJldHVybiBcIkVDT05OUkVGVVNFRFwiO1xuICAgIGNhc2Ugd2luRXJyb3JzLldTQUVDT05OUkVGVVNFRDpcbiAgICAgIHJldHVybiBcIkVDT05OUkVGVVNFRFwiO1xuICAgIGNhc2Ugd2luRXJyb3JzLkVSUk9SX05FVE5BTUVfREVMRVRFRDpcbiAgICAgIHJldHVybiBcIkVDT05OUkVTRVRcIjtcbiAgICBjYXNlIHdpbkVycm9ycy5XU0FFQ09OTlJFU0VUOlxuICAgICAgcmV0dXJuIFwiRUNPTk5SRVNFVFwiO1xuICAgIGNhc2Ugd2luRXJyb3JzLkVSUk9SX0FMUkVBRFlfRVhJU1RTOlxuICAgICAgcmV0dXJuIFwiRUVYSVNUXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuRVJST1JfRklMRV9FWElTVFM6XG4gICAgICByZXR1cm4gXCJFRVhJU1RcIjtcbiAgICBjYXNlIHdpbkVycm9ycy5FUlJPUl9CVUZGRVJfT1ZFUkZMT1c6XG4gICAgICByZXR1cm4gXCJFRkFVTFRcIjtcbiAgICBjYXNlIHdpbkVycm9ycy5XU0FFRkFVTFQ6XG4gICAgICByZXR1cm4gXCJFRkFVTFRcIjtcbiAgICBjYXNlIHdpbkVycm9ycy5FUlJPUl9IT1NUX1VOUkVBQ0hBQkxFOlxuICAgICAgcmV0dXJuIFwiRUhPU1RVTlJFQUNIXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuV1NBRUhPU1RVTlJFQUNIOlxuICAgICAgcmV0dXJuIFwiRUhPU1RVTlJFQUNIXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuRVJST1JfSU5TVUZGSUNJRU5UX0JVRkZFUjpcbiAgICAgIHJldHVybiBcIkVJTlZBTFwiO1xuICAgIGNhc2Ugd2luRXJyb3JzLkVSUk9SX0lOVkFMSURfREFUQTpcbiAgICAgIHJldHVybiBcIkVJTlZBTFwiO1xuICAgIGNhc2Ugd2luRXJyb3JzLkVSUk9SX0lOVkFMSURfTkFNRTpcbiAgICAgIHJldHVybiBcIkVJTlZBTFwiO1xuICAgIGNhc2Ugd2luRXJyb3JzLkVSUk9SX0lOVkFMSURfUEFSQU1FVEVSOlxuICAgICAgcmV0dXJuIFwiRUlOVkFMXCI7XG4gICAgLy8gY2FzZSB3aW5FcnJvcnMuRVJST1JfU1lNTElOS19OT1RfU1VQUE9SVEVEOiAgICAgICByZXR1cm4gXCJFSU5WQUxcIjtcbiAgICBjYXNlIHdpbkVycm9ycy5XU0FFSU5WQUw6XG4gICAgICByZXR1cm4gXCJFSU5WQUxcIjtcbiAgICBjYXNlIHdpbkVycm9ycy5XU0FFUEZOT1NVUFBPUlQ6XG4gICAgICByZXR1cm4gXCJFSU5WQUxcIjtcbiAgICBjYXNlIHdpbkVycm9ycy5FUlJPUl9CRUdJTk5JTkdfT0ZfTUVESUE6XG4gICAgICByZXR1cm4gXCJFSU9cIjtcbiAgICBjYXNlIHdpbkVycm9ycy5FUlJPUl9CVVNfUkVTRVQ6XG4gICAgICByZXR1cm4gXCJFSU9cIjtcbiAgICBjYXNlIHdpbkVycm9ycy5FUlJPUl9DUkM6XG4gICAgICByZXR1cm4gXCJFSU9cIjtcbiAgICBjYXNlIHdpbkVycm9ycy5FUlJPUl9ERVZJQ0VfRE9PUl9PUEVOOlxuICAgICAgcmV0dXJuIFwiRUlPXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuRVJST1JfREVWSUNFX1JFUVVJUkVTX0NMRUFOSU5HOlxuICAgICAgcmV0dXJuIFwiRUlPXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuRVJST1JfRElTS19DT1JSVVBUOlxuICAgICAgcmV0dXJuIFwiRUlPXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuRVJST1JfRU9NX09WRVJGTE9XOlxuICAgICAgcmV0dXJuIFwiRUlPXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuRVJST1JfRklMRU1BUktfREVURUNURUQ6XG4gICAgICByZXR1cm4gXCJFSU9cIjtcbiAgICBjYXNlIHdpbkVycm9ycy5FUlJPUl9HRU5fRkFJTFVSRTpcbiAgICAgIHJldHVybiBcIkVJT1wiO1xuICAgIGNhc2Ugd2luRXJyb3JzLkVSUk9SX0lOVkFMSURfQkxPQ0tfTEVOR1RIOlxuICAgICAgcmV0dXJuIFwiRUlPXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuRVJST1JfSU9fREVWSUNFOlxuICAgICAgcmV0dXJuIFwiRUlPXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuRVJST1JfTk9fREFUQV9ERVRFQ1RFRDpcbiAgICAgIHJldHVybiBcIkVJT1wiO1xuICAgIGNhc2Ugd2luRXJyb3JzLkVSUk9SX05PX1NJR05BTF9TRU5UOlxuICAgICAgcmV0dXJuIFwiRUlPXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuRVJST1JfT1BFTl9GQUlMRUQ6XG4gICAgICByZXR1cm4gXCJFSU9cIjtcbiAgICBjYXNlIHdpbkVycm9ycy5FUlJPUl9TRVRNQVJLX0RFVEVDVEVEOlxuICAgICAgcmV0dXJuIFwiRUlPXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuRVJST1JfU0lHTkFMX1JFRlVTRUQ6XG4gICAgICByZXR1cm4gXCJFSU9cIjtcbiAgICBjYXNlIHdpbkVycm9ycy5XU0FFSVNDT05OOlxuICAgICAgcmV0dXJuIFwiRUlTQ09OTlwiO1xuICAgIGNhc2Ugd2luRXJyb3JzLkVSUk9SX0NBTlRfUkVTT0xWRV9GSUxFTkFNRTpcbiAgICAgIHJldHVybiBcIkVMT09QXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuRVJST1JfVE9PX01BTllfT1BFTl9GSUxFUzpcbiAgICAgIHJldHVybiBcIkVNRklMRVwiO1xuICAgIGNhc2Ugd2luRXJyb3JzLldTQUVNRklMRTpcbiAgICAgIHJldHVybiBcIkVNRklMRVwiO1xuICAgIGNhc2Ugd2luRXJyb3JzLldTQUVNU0dTSVpFOlxuICAgICAgcmV0dXJuIFwiRU1TR1NJWkVcIjtcbiAgICBjYXNlIHdpbkVycm9ycy5FUlJPUl9GSUxFTkFNRV9FWENFRF9SQU5HRTpcbiAgICAgIHJldHVybiBcIkVOQU1FVE9PTE9OR1wiO1xuICAgIGNhc2Ugd2luRXJyb3JzLkVSUk9SX05FVFdPUktfVU5SRUFDSEFCTEU6XG4gICAgICByZXR1cm4gXCJFTkVUVU5SRUFDSFwiO1xuICAgIGNhc2Ugd2luRXJyb3JzLldTQUVORVRVTlJFQUNIOlxuICAgICAgcmV0dXJuIFwiRU5FVFVOUkVBQ0hcIjtcbiAgICBjYXNlIHdpbkVycm9ycy5XU0FFTk9CVUZTOlxuICAgICAgcmV0dXJuIFwiRU5PQlVGU1wiO1xuICAgIGNhc2Ugd2luRXJyb3JzLkVSUk9SX0JBRF9QQVRITkFNRTpcbiAgICAgIHJldHVybiBcIkVOT0VOVFwiO1xuICAgIGNhc2Ugd2luRXJyb3JzLkVSUk9SX0RJUkVDVE9SWTpcbiAgICAgIHJldHVybiBcIkVOT1RESVJcIjtcbiAgICBjYXNlIHdpbkVycm9ycy5FUlJPUl9FTlZWQVJfTk9UX0ZPVU5EOlxuICAgICAgcmV0dXJuIFwiRU5PRU5UXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuRVJST1JfRklMRV9OT1RfRk9VTkQ6XG4gICAgICByZXR1cm4gXCJFTk9FTlRcIjtcbiAgICBjYXNlIHdpbkVycm9ycy5FUlJPUl9JTlZBTElEX0RSSVZFOlxuICAgICAgcmV0dXJuIFwiRU5PRU5UXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuRVJST1JfSU5WQUxJRF9SRVBBUlNFX0RBVEE6XG4gICAgICByZXR1cm4gXCJFTk9FTlRcIjtcbiAgICBjYXNlIHdpbkVycm9ycy5FUlJPUl9NT0RfTk9UX0ZPVU5EOlxuICAgICAgcmV0dXJuIFwiRU5PRU5UXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuRVJST1JfUEFUSF9OT1RfRk9VTkQ6XG4gICAgICByZXR1cm4gXCJFTk9FTlRcIjtcbiAgICBjYXNlIHdpbkVycm9ycy5XU0FIT1NUX05PVF9GT1VORDpcbiAgICAgIHJldHVybiBcIkVOT0VOVFwiO1xuICAgIGNhc2Ugd2luRXJyb3JzLldTQU5PX0RBVEE6XG4gICAgICByZXR1cm4gXCJFTk9FTlRcIjtcbiAgICBjYXNlIHdpbkVycm9ycy5FUlJPUl9OT1RfRU5PVUdIX01FTU9SWTpcbiAgICAgIHJldHVybiBcIkVOT01FTVwiO1xuICAgIGNhc2Ugd2luRXJyb3JzLkVSUk9SX09VVE9GTUVNT1JZOlxuICAgICAgcmV0dXJuIFwiRU5PTUVNXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuRVJST1JfQ0FOTk9UX01BS0U6XG4gICAgICByZXR1cm4gXCJFTk9TUENcIjtcbiAgICBjYXNlIHdpbkVycm9ycy5FUlJPUl9ESVNLX0ZVTEw6XG4gICAgICByZXR1cm4gXCJFTk9TUENcIjtcbiAgICBjYXNlIHdpbkVycm9ycy5FUlJPUl9FQV9UQUJMRV9GVUxMOlxuICAgICAgcmV0dXJuIFwiRU5PU1BDXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuRVJST1JfRU5EX09GX01FRElBOlxuICAgICAgcmV0dXJuIFwiRU5PU1BDXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuRVJST1JfSEFORExFX0RJU0tfRlVMTDpcbiAgICAgIHJldHVybiBcIkVOT1NQQ1wiO1xuICAgIGNhc2Ugd2luRXJyb3JzLkVSUk9SX05PVF9DT05ORUNURUQ6XG4gICAgICByZXR1cm4gXCJFTk9UQ09OTlwiO1xuICAgIGNhc2Ugd2luRXJyb3JzLldTQUVOT1RDT05OOlxuICAgICAgcmV0dXJuIFwiRU5PVENPTk5cIjtcbiAgICBjYXNlIHdpbkVycm9ycy5FUlJPUl9ESVJfTk9UX0VNUFRZOlxuICAgICAgcmV0dXJuIFwiRU5PVEVNUFRZXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuV1NBRU5PVFNPQ0s6XG4gICAgICByZXR1cm4gXCJFTk9UU09DS1wiO1xuICAgIGNhc2Ugd2luRXJyb3JzLkVSUk9SX05PVF9TVVBQT1JURUQ6XG4gICAgICByZXR1cm4gXCJFTk9UU1VQXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuRVJST1JfQlJPS0VOX1BJUEU6XG4gICAgICByZXR1cm4gXCJFT0ZcIjtcbiAgICBjYXNlIHdpbkVycm9ycy5FUlJPUl9QUklWSUxFR0VfTk9UX0hFTEQ6XG4gICAgICByZXR1cm4gXCJFUEVSTVwiO1xuICAgIGNhc2Ugd2luRXJyb3JzLkVSUk9SX0JBRF9QSVBFOlxuICAgICAgcmV0dXJuIFwiRVBJUEVcIjtcbiAgICBjYXNlIHdpbkVycm9ycy5FUlJPUl9OT19EQVRBOlxuICAgICAgcmV0dXJuIFwiRVBJUEVcIjtcbiAgICBjYXNlIHdpbkVycm9ycy5FUlJPUl9QSVBFX05PVF9DT05ORUNURUQ6XG4gICAgICByZXR1cm4gXCJFUElQRVwiO1xuICAgIGNhc2Ugd2luRXJyb3JzLldTQUVTSFVURE9XTjpcbiAgICAgIHJldHVybiBcIkVQSVBFXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuV1NBRVBST1RPTk9TVVBQT1JUOlxuICAgICAgcmV0dXJuIFwiRVBST1RPTk9TVVBQT1JUXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuRVJST1JfV1JJVEVfUFJPVEVDVDpcbiAgICAgIHJldHVybiBcIkVST0ZTXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuRVJST1JfU0VNX1RJTUVPVVQ6XG4gICAgICByZXR1cm4gXCJFVElNRURPVVRcIjtcbiAgICBjYXNlIHdpbkVycm9ycy5XU0FFVElNRURPVVQ6XG4gICAgICByZXR1cm4gXCJFVElNRURPVVRcIjtcbiAgICBjYXNlIHdpbkVycm9ycy5FUlJPUl9OT1RfU0FNRV9ERVZJQ0U6XG4gICAgICByZXR1cm4gXCJFWERFVlwiO1xuICAgIGNhc2Ugd2luRXJyb3JzLkVSUk9SX0lOVkFMSURfRlVOQ1RJT046XG4gICAgICByZXR1cm4gXCJFSVNESVJcIjtcbiAgICBjYXNlIHdpbkVycm9ycy5FUlJPUl9NRVRBX0VYUEFOU0lPTl9UT09fTE9ORzpcbiAgICAgIHJldHVybiBcIkUyQklHXCI7XG4gICAgY2FzZSB3aW5FcnJvcnMuV1NBRVNPQ0tUTk9TVVBQT1JUOlxuICAgICAgcmV0dXJuIFwiRVNPQ0tUTk9TVVBQT1JUXCI7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBcIlVOS05PV05cIjtcbiAgfVxufVxuIl19
/////////////////////////////
/// Window Async Iterable APIs
/////////////////////////////

interface FileSystemDirectoryHandleAsyncIterator<T> extends AsyncIteratorObject<T, BuiltinIteratorReturn, unknown> {
  [Symbol.asyncIterator]: () => FileSystemDirectoryHandleAsyncIterator<T>
}

interface FileSystemDirectoryHandle {
  [Symbol.asyncIterator]: () => FileSystemDirectoryHandleAsyncIterator<[string, FileSystemHandle]>
  entries: () => FileSystemDirectoryHandleAsyncIterator<[string, FileSystemHandle]>
  keys: () => FileSystemDirectoryHandleAsyncIterator<string>
  values: () => FileSystemDirectoryHandleAsyncIterator<FileSystemHandle>
}

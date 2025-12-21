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

/////////////////////////////
/// Git Define
/////////////////////////////

declare interface GitInfo {
  owner: string
  repo: string
  branch: string
  pr: string
  commitHash: string
  shortCommitHash: string
  commitMessage: string
  commitTimestamp: string
}

declare const __GIT_DEFINE__: GitInfo

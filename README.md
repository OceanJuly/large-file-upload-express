# express 大文件上传后端部分

## 实现细节
文件分片传到后端，通过hash创建文件夹，`hash-index`保存文件分片，前端发送`merge`请求后，把对应文件夹的文件进行合并，生成`hash.exe`文件
#### 秒传
拿到前端返回的hash和文件后缀，判断`fileList`文件夹是否有`hash.exe`文件，有直接返回`true`，完成秒传
#### 断点续传
在fileList文件夹下查找是否有`hash`文件夹，有返回文件夹下的`hash-index`文件数组
#### 文件合并
获取`hash`文件夹，通过`hash-index`顺序合并，生成`hash.exe`文件
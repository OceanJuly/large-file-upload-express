const express = require('express')
const {resolve} = require("path");
const router = express.Router()
const fse = require('fs-extra')
const multiparty = require('multiparty')

const UPLOAD_FILES_DIR = resolve(__dirname, "./fileList")

/**
 * 检验文件是否已上传
 * 1. 存在直接返回 url
 * 2，不存在检查部分 chunk
 * */
router.post('/verifyFile', async (req, res) => {
    const {
        hash,
        suffix
    } = req.body
    console.log('verify hash: ', hash);
    const filePath = resolve(UPLOAD_FILES_DIR, hash + "." + suffix)
    let isExist = false
    try {
        isExist = await fse.pathExists(filePath)
    } catch (e) {
        res.send({
            code: 200,
            shouldUpload: true,
            uploadedChunkList: []
        })
    }
    console.log('秒传:', isExist);
    if (isExist) {
        res.send({
            code: 200,
            shouldUpload: true
        })
        return
    }
    const list = await getUpdatedChunks(hash)
    if (list.length) {
        res.send({
            code: 200,
            shouldUpload: true,
            uploadedChunks: list
        })
    } else {
        res.send({
            code: 200,
            shouldUpload: true,
            uploadedChunkList: []
        })
    }
    console.log('不是秒传: ', list);
})

router.post('/uploadChunks', async (req, res) => {
    const multipart = new multiparty.Form()
    multipart.parse(req, async (err, fields, files) => {
        if (err) return
        const [chunk] = files.chunk;
        const [hash] = fields.hash;
        const [suffix] = fields.suffix;
        // console.log('chunk:', chunk);
        // console.log('hash:', hash);
        // console.log('suffix:', suffix);
        const chunksDir = resolve(UPLOAD_FILES_DIR, hash.split("-")[0])
        if (!fse.pathExistsSync(chunksDir)) await fse.mkdirs(chunksDir)
        await fse.move(chunk.path, chunksDir + '/' + hash)
        res.status(200).send('received file chunk')
    })
})

router.post('/merge', async (req, res) => {
    const { hash, name, size } = req.body
    const filePath = resolve(UPLOAD_FILES_DIR, `${hash}${getSuffix(name)}`)
    // 如果大文件已经存在，则直接返回
    if (fse.pathExistsSync(filePath)) {
        return res.status(200).json({
            ok: true,
            msg: '合并成功'
        })
    }
    const chunkDir = resolve(UPLOAD_FILES_DIR, hash)
    console.log('chunkDir: ', chunkDir);
    console.log('hash: ', hash);
    console.log('pathExistsSync: ', fse.pathExistsSync(chunkDir));
    if (!fse.pathExistsSync(chunkDir)) {
        return res.status(200).json({
            oK: false,
            msg: '合并失败，请重新上传'
        })
    }
    await mergeChunks(filePath, hash, size)
    res.status(200).json({
        ok: true,
        msg: '合并成功'
    })
})

async function getUpdatedChunks(hash) {
    const exist = fse.pathExists(resolve(UPLOAD_FILES_DIR, hash))
    if (exist) {
        try {
            return await fse.readdir(resolve(UPLOAD_FILES_DIR, hash))
        } catch (e) {
            return []
        }
    }
    else return []
}

function getSuffix(name) {
    return name.slice(name.lastIndexOf('.'), name.length)
}

async function mergeChunks(filePath, hash, size) {
    const chunkDir = resolve(UPLOAD_FILES_DIR, hash)
    const chunkPaths = await fse.readdir(chunkDir)
    chunkPaths.sort((a, b) => {
        return a.split('-')[1] - b.split('-')[1]
    })
    const list = chunkPaths.map((chunkPath, index) => {
        pipeStream(
            resolve(chunkDir, chunkPath),
            fse.createWriteStream(filePath, {
                start: index * size,
                end: (index + 1) * size
            })
        )
    })
    await Promise.all(list)
    // window 权限问题，文件夹有内容执行 rmdirSync 会报错
    fse.emptyDirSync(chunkDir)
    fse.rmdirSync(chunkDir)
}

// 读的内容写到writeStream中
function pipeStream(path, writeStream) {
    return new Promise((res, rej) => {
        // 创建可读流
        const readStream = fse.createReadStream(path)
        readStream.on('read', async () => {
            fse.unlinksync(path)
            res()
        })
        readStream.pipe(writeStream)
    })
}

module.exports = router
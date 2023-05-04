import fs from 'fs/promises'
import { translate } from './gpt'
import { isPR, createFile, isFileExists } from './utils'
import {
  gitAdd,
  gitCheckout,
  gitCommitPush,
  gitCreateBranch,
  gitCreatePullRequest,
  gitPostComment,
  gitPush,
  gitSetConfig,
} from './git'
import { context } from '@actions/github'

export const publishTranslate = async (
  inputFilePath: string,
  outputFilePath: string,
  targetLang: string,
) => {
  await gitSetConfig()
  const branch = isPR() ? await gitCheckout() : await gitCreateBranch()

  async function listDir() {
    try {
      return await fs.readdir(inputFilePath).then(filenames  => {
        return filenames.filter(filename => filename.endsWith('.md'))}
        );
    } catch (err) {
      console.error('Error occurred while reading directory!', err);
    }
  }

  const directory_listing = await listDir();

  if (directory_listing){

    for(let file of directory_listing){

      const content = await fs.readFile(inputFilePath + file, 'utf-8')
      const translated = await translate(content, targetLang)
      await createFile(translated, outputFilePath + file)
      await gitAdd(branch, outputFilePath + file)
    }

    await gitPush(branch, outputFilePath)

    if (isPR()) {
      await gitPostComment('🎉Translation completed!')
      return

    }


  }










  }




  const issueNumber = context.issue.number
  const title = '🌐 Add LLM Translations'
  const body = `## ✅ LLM Translation completed
  |**Name**|**Value**|
  |---|---|
  |**Source**|\`${inputFilePath}\`|
  |**Output**|\`${outputFilePath}\`|
  |**Language**|${targetLang}|
  |**Issue**|#${issueNumber}|
  `

  await gitCreatePullRequest(branch, title, body)
  await gitPostComment('🎉Translation PR created!')
}

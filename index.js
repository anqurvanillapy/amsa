'use strict'

/**
 *  An AMsA entry file (JSON) looks basically like this:
 *
 *    {
 *      "questions": [
 *        {
 *          "date": 149839327661,
 *          "description": "The answer to life?",
 *          "answers": [
 *            {
 *              "date": 149839327661,
 *              "description": "*42*, of course"
 *            },
 *            {
 *              "date": 149839327662,
 *              "description": "*420*, why not?"
 *            }
 *          ]
 *        },
 *      ]
 *    }
 *
 *  - Note:
 *    1. `date` are in milliseconds
 *    2. The array `questions` is used as a LRU for answering but the generated
 *    pages will be sorted by date
 */

const fs = require('fs')
const pagegen = require('./pagegen')

const USAGE =
`Usage: amsa COMMAND your_amsa.json

Commands:
  ask     Ask a new question
  answer  Answer a question`

let entry, entryPath

function showUsage () {
  console.error(USAGE)
  process.exit(1)
}

function main () {
  if (process.argv.length !== 4) showUsage()

  entryPath = process.argv[3]

  let commands = {
    ask: ask,
    answer: answer
  }

  try {
    entry = JSON.parse(fs.readFileSync(entryPath))
  } catch (e) {
    console.log(`WARNING: File "${entryPath}" does not exist`)
    entry = { questions: [] }
  }

  // Ready for reading lines from stdin.
  process.stdin.setEncoding('utf8')

  try {
    commands[process.argv[2].toLowerCase()]()
  } catch (e) {
    console.error(`Command "${process.argv[2]}" does not exist\n`)
    showUsage()
  }
}

function ask () {
  process.stdout.write('?> ')
  process.stdin.resume()
  process.stdin.once('data', desc => {
    process.stdin.pause()

    entry.questions.push({
      date: +new Date(),
      description: desc.trim()
    })

    // Answer the question immediately.
    answer(true)
  })
}

function answer (imm = false) {
  if (!entry.questions.length) {
    console.error('No questions yet')
    process.exit(1)
  }

  let choice

  if (!imm) {
    console.log()
    entry.questions.forEach((q, i) => {
      console.log(`  \x1B[32m${i}.\x1B[0m ${q.description}`)
    })
    console.log()

    process.stdout.write('Which to answer? [int] ')
    process.stdin.resume()
    process.stdin.once('data', i => {
      process.stdin.pause()

      choice = parseInt(i)
      if (!entry.questions[choice]) {
        console.error(`"${choice}" is not a valid index`)
        process.exit(1)
      }
    })
  }
}

function updateEntry () {
}

;(function () {
  main()
  updateEntry()
})()

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
 *    2. The array `questions` is used as an LRU for answering but the generated
 *    pages will be sorted by date
 */

const fs = require('fs')
const pagegen = require('./pagegen')

const [
  RST, GRN
] = [0, 32].map(c => `\x1B[${c}m`)

const USAGE =
`Usage: amsa COMMAND your_amsa.json

Commands:
  ask     Ask a new question
  answer  Answer a question
  ls      List all questions and answers`

let entry, entryPath

function showUsage () {
  console.error(USAGE)
  process.exit(1)
}

function getLine (prompt) {
  return new Promise((resolve, reject) => {
    process.stdout.write(prompt)
    process.stdin.resume()
    process.stdin.once('data', line => {
      process.stdin.pause()
      resolve(line)
    })
  })
}

function main () {
  return new Promise((resolve, reject) => {
    if (process.argv.length !== 4) showUsage()

    entryPath = process.argv[3]

    let commands = {
      ask: ask,
      answer: answer
    }

    try {
      entry = JSON.parse(fs.readFileSync(entryPath))
    } catch (e) {
      // console.log(`WARNING: File "${entryPath}" does not exist`)
      console.log(`WARNING: ${e.message}`)
      entry = { questions: [] }
    }

    // Ready for reading lines from stdin.
    process.stdin.setEncoding('utf8')

    try {
      commands[process.argv[2].toLowerCase()]().then(_ => { resolve() })
    } catch (e) {
      console.error(`Command "${process.argv[2]}" does not exist\n`)
      showUsage()
    }
  })
}

function ask () {
  return new Promise((resolve, reject) => {
    getLine('?> ').then(desc => {
      entry.questions.push({
        date: +new Date(),
        description: desc.trim(),
        answers: []
      })

      // Answer the question immediately.
      answer(true).then(_ => { resolve() })
    })
  })
}

function answer (imm = false) {
  return new Promise((resolve, reject) => {
    if (!entry.questions.length) {
      console.error('No questions yet')
      process.exit(1)
    }

    let choice
    let pGetChoice = new Promise((resolve, reject) => {
      if (!imm) {
        console.log()
        entry.questions.forEach((q, i) => {
          console.log(`  ${GRN}${i}.${RST} ${q.description}`)
        })
        console.log()

        getLine('Which to answer? [int] ').then(i => {
          choice = parseInt(i)
          if (!entry.questions[choice]) {
            console.error(`"${choice}" is not a valid index`)
            process.exit(1)
          }

          resolve()
        })
      } else {
        choice = entry.questions.length - 1
        resolve()
      }
    })

    pGetChoice.then(_ => {
      let [asked] = entry.questions.splice(choice, 1)
      console.log(`\n${GRN}@${RST} ${new Date(asked.date)}`)
      console.log(`${GRN}#${RST} ${asked.description}\n`)

      getLine('!> ').then(parag => {
        asked.answers.push({
          date: +new Date(),
          description: parag.trim()
        })

        entry.questions.push(asked)
        resolve() // exits answer
      })
    })
  })
}

;(function () {
  main().then(_ => {
    fs.writeFileSync(entryPath, JSON.stringify(entry, null, 2) + '\n')
    pagegen.generate(entryPath)
  })
})()

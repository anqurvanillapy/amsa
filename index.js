'use strict'

/**
 *  An AMsA entry file (JSON) looks basically like this:
 *
 *    {
 *      "questions": [
 *        {
 *          "date": 1498393276610951095,
 *          "description": "The answer to life?",
 *          "answers": [
 *            {
 *              "date": 1498393276610951095,
 *              "description": "*42*, of course"
 *            },
 *            {
 *              "data": 1498393276610951096,
 *              "description": "*420*, why not?"
 *            }
 *          ]
 *        },
 *      ]
 *    }
 */

const fs = require('fs')
const pagegen = require('./pagegen')

let entry, entryPath

function showUsage () {
  console.error(`Usage: amsa COMMAND your_amsa.json

  Commands:
    ask     Ask a new question
    answer  Answer a question`)
  process.exit(1)
}

function parseArgs () {
  if (process.argv.length !== 4) showUsage()

  entryPath = process.argv[3]
  let commands = {
    ask: ask,
    answer: answer
  }

  try {
    entry = JSON.parse(fs.readFileSync(entryPath))
  } catch (e) {
    entry = {}
  }

  try {
    commands[process.argv[2].toLowerCase()]()
  } catch (e) {
    console.error(`Command "${process.argv[2]}" does not exist\n`)
    showUsage()
  }
}

function ask () {
  console.log('ask')
}

function answer () {
  console.log('answer')
}

;(function () {
  parseArgs()
})()

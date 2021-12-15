import { downloadZip } from 'client-zip'
import { saveAs } from 'file-saver'
import { random, toNumber } from 'lodash'
import { radToDeg } from 'three/src/math/MathUtils'

import { frameAmount, commandFrameData, tweenFrames, tweenedFrameData } from './frames'
import { StringObject, Tags } from './interfaces'
import { radArrToDeg } from './maths'
import { cleanNumber, cubes, projectDescription, projectName } from './util'

const killAll = 'kill @e[tag=animation]'
const timerReset = 'scoreboard players set timer animation 0'
const scoreboardTemplate = 'scoreboard objectives add animation dummy'
const tickTemplate =
    'execute unless score timer animation matches FRAMES.. run scoreboard players add timer animation 1\n' +
    'execute if score timer animation matches FRAMES.. run scoreboard players set timer animation 0\n' +
    'execute as @e[type=!player] run data merge entity @s {DeathTime:19}\n'
const packMCMeta =
    '{\n' +
    '    "pack": {\n' +
    '        "pack_format": 8,\n' +
    '        "description": "DESCRIPTION"\n' +
    '    }\n' +
    '}\n'
const tickJSON = '{ "values": [ "NAMESPACE:tick" ] }'

let randomPrefixes = {}

// TODO create function to automate the === "" ? "" nonesense
const tagFunctions = {
    Head: function (value: string) {
        return value === '' ? '' : `Head:[${value[0]}f,${-value[1]}f,${-value[2]}f]`
    },
    Body: function (value: string) {
        return value === '' ? '' : `Body:[${value[0]}f,${-value[1]}f,${-value[2]}f]`
    },
    LeftArm: function (value: string) {
        return value === '' ? '' : `LeftArm:[${value[0]}f,${-value[1]}f,${-value[2]}f]`
    },
    RightArm: function (value: string) {
        return value === '' ? '' : `RightArm:[${value[0]}f,${-value[1]}f,${-value[2]}f]`
    },
    LeftLeg: function (value: string) {
        return value === '' ? '' : `LeftLeg:[${value[0]}f,${-value[1]}f,${-value[2]}f]`
    },
    RightLeg: function (value: string) {
        return value === '' ? '' : `RightLeg:[${value[0]}f,${-value[1]}f,${-value[2]}f]`
    },
    Pose: function (values: Tags) {
        const parts = values as StringObject
        return parts.Head === '' &&
            parts.Body === '' &&
            parts.LeftArm === '' &&
            parts.RightArm === '' &&
            parts.LeftLeg === '' &&
            parts.RightLeg === ''
            ? ''
            : `Pose:{${generateNBT(values)}}`
    },
    Tags: function (values: string[]) {
        let acc = 'Tags:['
        for (const value of values) {
            acc += `"${value}",`
        }
        return acc.slice(0, -1) + ']'
    },
    Rotation: function (values: number[] | '') {
        return values === '' ? '' : `Rotation:[${-values[0]}f,${values[1]}f]`
    },
    Pos: function (values: number[]) {
        return `Pos:[${values[0]}d,${values[1]}d,${values[2]}d]`
    },
    NoGravity: function (value: number) {
        return `NoGravity:${value}b`
    },
    NoAI: function (value: number) {
        return `NoAI:${value}b`
    },
    Invulnerable: function (value: number) {
        return `Invulnerable:${value}b`
    },
    Invisible: function (value: number) {
        return `Invisible:${value}b`
    },
    ShowArms: function (value: number) {
        return `ShowArms:${value}b`
    },
    NoBasePlate: function (value: number) {
        return `NoBasePlate:${value}b`
    },
    Marker: function (value: number) {
        return `Marker:${value}b`
    },
    ArmorItems: function (values: Tags[] | '') {
        return values === ''
            ? ''
            : `ArmorItems:[{${generateNBT(values[0])}},{${generateNBT(values[1])}},{${generateNBT(
                  values[2],
              )}},{${generateNBT(values[3])}}]`
    },
    tag: function (values: Tags) {
        return `tag:{${generateNBT(values)}}`
    },
    id: function (value: string) {
        return `id:"${value}"`
    },
    Count: function (value: number) {
        return `Count:${value}b`
    },
    SkullOwner: function (value: string) {
        return `SkullOwner:"${value}"`
    },
    BlockState: function (value: Tags) {
        return `BlockState:{${generateNBT(value)}}`
    },
    Name: function (value: string) {
        return `Name:"minecraft:${value}"`
    },
}

export function packMeta() {
    return (
        '{\n' +
        '    "pack": {\n' +
        '        "pack_format": 7,\n' +
        `        "description": "${projectDescription}"\n` +
        '    }\n' +
        '}'
    )
}

export function tick() {
    return '{\n' + '    "values": [\n' + `        "animation:tick"\n` + '    ]\n' + '}'
}

function generateNBT(tags: Tags) {
    let nbt = ''
    for (const [tag, value] of Object.entries(tags)) {
        if (value !== '') {
            let input = value
            if (typeof value === 'number') {
                const clean = cleanNumber(value, 4)
                input = clean ? toNumber(clean) : 0
            }
            if (typeof value === 'object' && typeof value[0] === 'number') {
                const clean = []
                for (const val of value as number[]) {
                    const c = cleanNumber(val, 4)
                    clean.push(c ? toNumber(c) : 0)
                }
                input = clean
            }

            const result = tagFunctions[tag](input)
            if (result !== '') {
                nbt += result + ','
            }
        }
    }

    return nbt.slice(0, -1)
}

function summonCommandGenerate(frame: number, entityName: string, xyz: number[], tags: Tags, nbtText: string) {
    randomPrefixes[tags.Tags[0] as string] =
        Math.random()
            .toString(36)
            .replaceAll(/[^a-z]+/g, '')
            .slice(0, 5) + '-'
    tags.Tags[0] = randomPrefixes[tags.Tags[0] as string] + tags.Tags[0]
    return (
        `execute if score timer animation matches ${frame} run ` +
        `summon minecraft:${entityName} ~${xyz[0]} ~${xyz[1]} ~${xyz[2]} {${generateNBT(tags)}` +
        (nbtText === '' ? '}' : `,${nbtText.slice(1)}\n`)
    )
}

function mergeCommandGenerate(frame: number, entityID: string, xyz: number[], tags: Tags, nbtText: string) {
    entityID = randomPrefixes[entityID as string] + entityID
    return (
        `execute if score timer animation matches ${frame} run ` +
        `data merge entity @e[tag=${entityID},limit=1] {${generateNBT(tags)}}\n` +
        (nbtText === ''
            ? ''
            : `execute if score timer animation matches ${frame} run ` +
              `data merge entity @e[tag=${entityID},limit=1] ${nbtText}\n`) +
        (xyz === null
            ? ''
            : `execute if score timer animation matches ${frame} run ` +
              `tp @e[tag=${entityID},limit=1] ~${cleanNumber(xyz[0] + random(0, 0.000001, true), -1)} ~${cleanNumber(
                  xyz[1] + random(0, 0.000001, true),
                  -1,
              )} ~${cleanNumber(xyz[2] + random(0, 0.000001, true), -1)}`)
        // ? the random is to avoid a bug where the entity teleports to the
        // ? desired location in increments instead of immediately
        // ? this only happens when there are a significant amount of values being animated
        // ? and the desired position is held for a reasonable amount of time
        // ? as of 1.17.1
    )
}

function armorStandSummon(mob: string, frame: number) {
    const data = commandFrameData[frame]

    let pos = null
    if (data[mob + '|base'] !== undefined && data[mob + '|base'].translation !== undefined) {
        pos = data[mob + '|base'].translation
    }

    return summonCommandGenerate(
        frame,
        'armor_stand',
        pos,
        {
            Pose: {
                Head:
                    data[mob + '|head'] === undefined || data[mob + '|head'].rotation === undefined
                        ? ''
                        : radArrToDeg(data[mob + '|head'].rotation),
                Body:
                    data[mob + '|body'] === undefined || data[mob + '|body'].rotation === undefined
                        ? ''
                        : radArrToDeg(data[mob + '|body'].rotation),
                LeftArm:
                    data[mob + '|left_arm'] === undefined || data[mob + '|left_arm'].rotation === undefined
                        ? ''
                        : radArrToDeg(data[mob + '|left_arm'].rotation),
                RightArm:
                    data[mob + '|right_arm'] === undefined || data[mob + '|right_arm'].rotation === undefined
                        ? ''
                        : radArrToDeg(data[mob + '|right_arm'].rotation),
                LeftLeg:
                    data[mob + '|left_leg'] === undefined || data[mob + '|left_leg'].rotation === undefined
                        ? ''
                        : radArrToDeg(data[mob + '|left_leg'].rotation),
                RightLeg:
                    data[mob + '|right_leg'] === undefined || data[mob + '|right_leg'].rotation === undefined
                        ? ''
                        : radArrToDeg(data[mob + '|right_leg'].rotation),
            },
            Rotation:
                data[mob + '|base'] === undefined || data[mob + '|base'].rotation === undefined
                    ? ''
                    : [radToDeg(data[mob + '|base'].rotation[1]), 0],
            Tags: [mob.replaceAll(/\|/g, '-'), 'animation'],
            ShowArms: 1,
            NoGravity: 1,
            Marker: 1,
            NoBasePlate: 1,
            ArmorItems:
                data[mob + '|head'] === undefined ||
                data[mob + '|head'].skullowner === undefined ||
                data[mob + '|head'].skullowner === ''
                    ? ''
                    : [
                          {},
                          {},
                          {},
                          {
                              id: 'player_head',
                              Count: 1,
                              tag: {
                                  SkullOwner: data[mob + '|head'].skullowner,
                              },
                          },
                      ],
        },
        data[mob + '|base'].nbt,
    )
}

function armorStandMerge(mob: string, frame: number) {
    const data = commandFrameData[frame]
    const tweenedData = tweenedFrameData[frame]

    const pos = tweenedData[mob + '|base'].translation

    return mergeCommandGenerate(
        frame,
        mob.replaceAll(/\|/g, '-'),
        pos,
        {
            Pose: {
                Head:
                    data[mob + '|head'] === undefined || data[mob + '|head'].rotation === undefined
                        ? ''
                        : radArrToDeg(data[mob + '|head'].rotation),
                Body:
                    data[mob + '|body'] === undefined || data[mob + '|body'].rotation === undefined
                        ? ''
                        : radArrToDeg(data[mob + '|body'].rotation),
                LeftArm:
                    data[mob + '|left_arm'] === undefined || data[mob + '|left_arm'].rotation === undefined
                        ? ''
                        : radArrToDeg(data[mob + '|left_arm'].rotation),
                RightArm:
                    data[mob + '|right_arm'] === undefined || data[mob + '|right_arm'].rotation === undefined
                        ? ''
                        : radArrToDeg(data[mob + '|right_arm'].rotation),
                LeftLeg:
                    data[mob + '|left_leg'] === undefined || data[mob + '|left_leg'].rotation === undefined
                        ? ''
                        : radArrToDeg(data[mob + '|left_leg'].rotation),
                RightLeg:
                    data[mob + '|right_leg'] === undefined || data[mob + '|right_leg'].rotation === undefined
                        ? ''
                        : radArrToDeg(data[mob + '|right_leg'].rotation),
            },
            Rotation: data[mob + '|base']?.rotation === undefined ? '' : [radToDeg(data[mob + '|base'].rotation[1]), 0],
            ArmorItems:
                data[mob + '|head'] === undefined ||
                data[mob + '|head'].skullowner === undefined ||
                data[mob + '|head'].skullowner === ''
                    ? ''
                    : [
                          {},
                          {},
                          {},
                          {
                              id: 'player_head',
                              Count: 1,
                              tag: {
                                  SkullOwner: data[mob + '|head'].skullowner,
                              },
                          },
                      ],
        },
        tweenedData[mob + '|base'].nbt,
    )
}

function playerHeadSummon(mob: string, frame: number) {
    const data = commandFrameData[frame]
    const name = mob.split('|')[0]

    // TODO find more elegant solution to this trash
    const pos = data[mob + '|player_head']?.translation || null

    let nbtText = ''
    for (const [key, value] of Object.entries(data)) {
        if (key.startsWith(mob + '|') && value.nbt !== undefined) {
            nbtText = value.nbt
            break
        }
    }

    let armorItems = [
        {},
        {},
        {},
        {
            id: 'player_head',
            Count: 1,
            tag: {
                SkullOwner: data[mob + '|player_head']?.skullowner || '',
            },
        },
    ]

    return summonCommandGenerate(
        frame,
        name.replaceAll('player_head', 'armor_stand'),
        pos,
        {
            Tags: [mob.replaceAll(/\|/g, '-'), 'animation'],
            NoGravity: 1,
            Invulnerable: 1,
            Invisible: 1,
            ArmorItems: armorItems,
            Pose: data[mob + '|player_head']
                ? {
                      Head: radArrToDeg(data[mob + '|player_head'].rotation),
                  }
                : '',
        },
        nbtText,
    )
}

// TODO seperate out falling_block
function genericSummon(mob: string, frame: number) {
    const data = commandFrameData[frame]
    const name = mob.split('|')[0]

    // TODO find more elegant solution to this trash
    const pos = data[mob + '|body']?.translation || data[mob + '|block']?.translation || null

    const body = data[mob + '|body']?.rotation || ''

    let head: number[] | '' = ''
    if (data[mob + '|head'] !== undefined) {
        head = data[mob + '|head'].rotation
    } else if (data[mob + '|neck'] !== undefined) {
        head = data[mob + '|head'].rotation
    } else {
        head = body
    }

    let nbtText = ''
    for (const [key, value] of Object.entries(data)) {
        if (key.startsWith(mob + '|') && value.nbt !== undefined) {
            nbtText = value.nbt
            break
        }
    }

    let armorItems: {} | string = ''
    if (data[mob + '|head']?.skullowner) {
        armorItems = [
            {},
            {},
            {},
            {
                id: 'player_head',
                Count: 1,
                tag: {
                    SkullOwner: data[mob + '|head']?.skullowner,
                },
            },
        ]
    }

    return summonCommandGenerate(
        frame,
        name,
        pos,
        {
            Rotation: body === '' || head === '' ? '' : [radToDeg(-body[1]), radToDeg(head[0])],
            Tags: [mob.replaceAll(/\|/g, '-'), 'animation'],
            NoGravity: 1,
            NoAI: 1,
            Invulnerable: 1,
            ArmorItems: armorItems,
            BlockState:
                data[mob + '|block'] !== undefined
                    ? {
                          Name: data[mob + '|block']?.block || 'sand',
                      }
                    : '',
        },
        nbtText,
    )
}

function playerHeadMerge(mob: string, frame: number) {
    const data = commandFrameData[frame]
    const name = mob.split('|')[0]

    const pos = data[mob + '|player_head']?.translation || null

    let nbtText = ''
    for (const [key, value] of Object.entries(data)) {
        if (key.startsWith(mob + '|') && value.nbt !== undefined) {
            nbtText = value.nbt
            break
        }
    }

    return mergeCommandGenerate(
        frame,
        mob.replaceAll(/\|/g, '-'),
        pos,
        {
            Pose: data[mob + '|player_head']
                ? {
                      Head: radArrToDeg(data[mob + '|player_head'].rotation),
                  }
                : '',
        },
        nbtText,
    )
}

function genericMerge(mob: string, frame: number) {
    const data = commandFrameData[frame]
    const name = mob.split('|')[0]

    const pos =
        data[mob + '|body']?.translation ||
        data[mob + '|block']?.translation ||
        data[mob + '|player_head']?.translation ||
        null

    const body = data[mob + '|body']?.rotation || ''

    let head: number[] | '' = ''
    if (data[mob + '|head'] !== undefined) {
        head = data[mob + '|head'].rotation
    } else if (data[mob + '|neck'] !== undefined) {
        head = data[mob + '|head'].rotation
    } else {
        head = body
    }

    let nbtText = ''
    for (const [key, value] of Object.entries(data)) {
        if (key.startsWith(mob + '|') && value.nbt !== undefined) {
            nbtText = value.nbt
            break
        }
    }

    return mergeCommandGenerate(
        frame,
        mob.replaceAll(/\|/g, '-'),
        pos,
        {
            Rotation: body === '' || head === '' ? '' : [radToDeg(-body[1]), radToDeg(head[0])],
            ArmorItems: data[mob + '|head']?.skullowner
                ? [
                      {},
                      {},
                      {},
                      {
                          id: 'player_head',
                          Count: 1,
                          tag: {
                              SkullOwner: data[mob + '|head']?.skullowner,
                          },
                      },
                  ]
                : '',
            BlockState: {
                Name: data[mob + '|block']?.block || 'sand',
            },
        },
        nbtText,
    )
}

function generateSummon(mob: string, frame: number) {
    let name = mob.split('|')[0]
    if (name === 'armor_stand') {
        return armorStandSummon(mob, frame)
    }
    if (name === 'player_head') {
        return playerHeadSummon(mob, frame)
    } else {
        return genericSummon(mob, frame)
    }
}

function generateMerge(mob: string, frame: number) {
    const name = mob.split('|')[0]
    if (name === 'armor_stand') {
        return armorStandMerge(mob, frame)
    }
    if (name === 'player_head') {
        return playerHeadMerge(mob, frame)
    } else {
        return genericMerge(mob, frame)
    }
}

export async function saveCommands() {
    tweenFrames()

    let start = killAll + '\n'
    start += scoreboardTemplate + '\n'
    start += timerReset + '\n'
    let loop = ''

    randomPrefixes = {}

    for (let f = 0; f < frameAmount; f++) {
        for (const [key] of Object.entries(cubes)) {
            if (key !== 'parts' && key !== 'models') {
                if (f === 0) {
                    start += generateSummon(key, f) + '\n'
                }
                loop += generateMerge(key, f) + '\n'
            }
        }
    }

    const packMCMetaFile = {
        name: 'pack.mcmeta',
        lastModified: new Date(),
        input: packMCMeta.replaceAll('DESCRIPTION', projectDescription),
    }
    const tickJSONFile = {
        name: 'data/minecraft/tags/functions/tick.json',
        lastModified: new Date(),
        input: tickJSON.replaceAll('NAMESPACE', projectName.toLowerCase()),
    }
    const tickMCFunctionFile = {
        name: `data/${projectName.toLowerCase()}/functions/tick.mcfunction`,
        lastModified: new Date(),
        input: tickTemplate.replaceAll('FRAMES', `${frameAmount}`),
    }
    const startFile = {
        name: `data/${projectName.toLowerCase()}/functions/start.mcfunction`,
        lastModified: new Date(),
        input: start,
    }
    const loopFile = {
        name: `data/${projectName.toLowerCase()}/functions/loop.mcfunction`,
        lastModified: new Date(),
        input: loop,
    }

    const blob = await downloadZip([packMCMetaFile, tickJSONFile, tickMCFunctionFile, startFile, loopFile]).blob()

    saveAs(blob, projectName + '.zip')
}

import _ from 'lodash'
import { Object3D } from 'three'
import { highlightedPart, setHighlightedPart } from './controls'
import { Settings } from './interfaces'
import { properties } from './properties'

export const settings: Settings = {}
export let settingsPart: string = ''

fetch('/settings/general.json')
    .then((res) => res.json())
    .then((res) => {
        settings.general = res
    })

// TODO remove intermediate variables "canRotateX"
export function loadSettings(part: Object3D) {
    setHighlightedPart(part)

    for (const property in properties) {
        if (properties[property].enabled()) {
            return
        }
    }

    loadSettings(part.parent)
}

export function setSettingsPart(part: string) {
    settingsPart = part
}

export function getSetting(entity: string, settingPath: string, partName: string): string {
    const a = _.get(settings[entity], settingPath + '.' + partName)
    const b = _.get(settings[entity], settingPath + '.general')
    const c = _.get(settings.general, settingPath + '.' + partName)
    const d = _.get(settings.general, settingPath + '.general')

    if (a !== undefined) {
        return a
    } else if (b !== undefined) {
        return b
    } else if (c !== undefined) {
        return c
    } else if (d !== undefined) {
        return d
    } else {
        return ''
    }
}

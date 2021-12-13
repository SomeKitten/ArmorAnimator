import _ from 'lodash'
import { Object3D } from 'three'
import { setCanChangeBlock, setCanRotate, setCanTranslate, setCanWearArmor } from './controls'
import { Settings } from './interfaces'

export const settings: Settings = {}
fetch('/settings/general.json')
    .then((res) => res.json())
    .then((res) => {
        settings.general = res
    })

// TODO remove intermediate variables "canRotateX"
export function loadSettings(part: Object3D) {
    const entity = part.name.split('|')[0]
    const partName = part.name.split('|')[2]

    setCanRotate(getSetting(entity, 'freedom.rotate', partName))
    setCanTranslate(getSetting(entity, 'freedom.translate', partName))
    setCanWearArmor(getSetting(entity, 'armor', partName))
    setCanChangeBlock(getSetting(entity, 'block', partName))
}

export function getSetting(entity: string, settingPath: string, partName: string) {
    return (
        _.get(settings[entity], settingPath + '.' + partName) ||
        _.get(settings[entity], settingPath + '.general') ||
        _.get(settings.general, settingPath + '.' + partName) ||
        _.get(settings.general, settingPath + '.general')
    )
}

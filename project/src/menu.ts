// NEXT keybinds/tutorial menu
// NEXT menu for keybinds, mousebinds, and interface options
// NEXT toggle for looping
// TODO allow mob stacking
// TODO toggles and inputs for commonly used data tags
// TODO generate toggles and inputs for all data tags (more research needed)

import { toNumber } from 'lodash'
import { cleanNumber, htmlToElement } from './util'
import { degToRad } from 'three/src/math/MathUtils'
import {
    getHighlightedProperties,
    getPropertyValue,
    previewPropertyValue,
    propertyNames,
    setPropertyValue,
} from './properties'
import { frame } from './frames'

const inputHTML = {
    normal: `<input class="property-input-type" type="text">`,
    top: `<input class="property-input-type property-input-type-top" type="text">`,
}
const divLabelHTML = {
    normal: `
  <div class="property-input-label">
    Property Name
  </div>
  `,
    bottom: `
  <div class="property-input-label property-input-label-bottom">
    Property Name
  </div>
  `,
}

export const propertyInputDiv: HTMLDivElement = document.getElementById('property-input') as HTMLDivElement

export let propertyInputs: { [key: string]: HTMLInputElement } = {}
export let propertyInputTexts: { [key: string]: string } = {}
export let propertyInputOriginals: { [key: string]: number | string } = {}

const truncateNumber = 5

export function resetProperties() {
    deletePropertyInputs()
    createPropertyInputs(getHighlightedProperties())
}

function setPropertyNumberDisplay(property: string, value: string) {
    propertyInputTexts[property] = cleanNumber(value, truncateNumber) as string
    propertyInputs[property].value = propertyInputTexts[property]
}

function setPropertyStringDisplay(property: string, value: string) {
    propertyInputTexts[property] = value
    propertyInputs[property].value = value
}

export function setPropertyNumber(property: string, value: number) {
    setPropertyNumberDisplay(property, value.toString())
    propertyInputOriginals[property] = value
}

export function setPropertyString(property: string, value: string) {
    setPropertyStringDisplay(property, value)
    propertyInputOriginals[property] = value
}

export function createPropertyInputs(properties: string[]) {
    for (let i = 0; i < properties.length; i++) {
        let inputSelect = 'normal'
        let divLabelSelect = 'normal'
        if (i === 0) {
            inputSelect = 'top'
        }
        if (i === properties.length - 1) {
            divLabelSelect = 'bottom'
        }

        propertyInputs[properties[i]] = createPropertyInput(
            inputHTML[inputSelect],
            divLabelHTML[divLabelSelect],
            properties[i],
            getPropertyValue(properties[i]),
        )
    }
}

export function createPropertyInput(
    inputText: string,
    inputLabel: string,
    property: string,
    defaultValue: number | string,
) {
    const propertyInput = htmlToElement(inputText) as HTMLInputElement
    const propertyInputLabel = htmlToElement(inputLabel)

    propertyInputs[property] = propertyInput
    propertyInputDiv.appendChild(propertyInput)

    if (typeof defaultValue === 'number') {
        // NEXT drag controls for property input

        propertyInput.addEventListener('input', (event) => onPropertyTypeNumber(event, property))
        if (property === 'frames') {
            propertyInput.addEventListener('wheel', (event) => onPropertyScrollNumber(event, property, 1 / 100))
        } else {
            propertyInput.addEventListener('wheel', (event) => onPropertyScrollNumber(event, property))
        }
        setPropertyNumber(property, defaultValue)

        propertyInput.classList.add('property-input-type-number')
    } else if (typeof defaultValue === 'string') {
        propertyInput.addEventListener('input', (event) => onPropertyTypeString(event, property))
        setPropertyString(property, defaultValue)
    }

    propertyInput.focus()

    propertyInputDiv.appendChild(propertyInputLabel)
    const customName = propertyNames[property]
    propertyInputLabel.innerHTML = customName ? customName : property

    return propertyInput
}

export function deletePropertyInputs() {
    const types = document.querySelectorAll('input.property-input-type')
    for (const type of types) {
        type.remove()
    }
    const labels = document.querySelectorAll('div.property-input-label')
    for (const label of labels) {
        label.remove()
    }
    propertyInputs = {}
}

function onPropertyTypeNumber(event: Event, property: string) {
    event.preventDefault()

    let cleaned = cleanNumber((event.target as HTMLInputElement).value, truncateNumber)

    if (cleaned === false) {
        setPropertyNumberDisplay(property, propertyInputTexts[property])
    } else {
        setPropertyValue(frame, property, toNumber(cleaned))
        setPropertyNumber(property, getPropertyValue(property) as number)
    }
}

function onPropertyTypeString(event: Event, property: string) {
    event.preventDefault()

    let value = (event.target as HTMLInputElement).value

    setPropertyValue(frame, property, value)
    setPropertyString(property, getPropertyValue(property) as string)
}

function onPropertyScrollNumber(event: Event, property: string, multiple?: number) {
    multiple = multiple ? multiple : 1 / 4000

    let newVal = 0

    if (property.startsWith('rotate')) {
        newVal = (getPropertyValue(property) as number) - degToRad((event as WheelEvent).deltaY)
    } else {
        newVal = (getPropertyValue(property) as number) - (event as WheelEvent).deltaY * multiple
    }

    setPropertyValue(frame, property, newVal)
    setPropertyNumber(property, getPropertyValue(property) as number)
}

export function resetPropertyValues() {
    for (const [key, original] of Object.entries(propertyInputOriginals)) {
        previewPropertyValue(key, original)
    }
}

export function setPropertyValues() {
    for (const [key, original] of Object.entries(propertyInputOriginals)) {
        setPropertyValue(frame, key, original)
    }
}

export function resetPropertyInputOriginals() {
    propertyInputOriginals = {}
}

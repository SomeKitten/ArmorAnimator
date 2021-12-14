// NEXT keybinds/tutorial menu
// NEXT menu for keybinds, mousebinds, and interface options
// NEXT toggle for looping
// TODO allow mob stacking
// TODO toggles and inputs for commonly used data tags
// TODO generate toggles and inputs for all data tags (more research needed)

import { toNumber } from 'lodash'
import { cleanNumber, htmlToElement } from './util'
import { degToRad } from 'three/src/math/MathUtils'
import { getHighlightedProperties, Property } from './properties'
import { frame, frameData, tweenedFrameData, tweenFrames } from './frames'
import { highlightedPart } from './controls'

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

const truncateNumber = 5

export function resetProperties() {
    deletePropertyInputs()
    createPropertyInputs(getHighlightedProperties())
}

export function setPropertyNumber(property: Property, value: number) {
    property.element.value = cleanNumber(value, truncateNumber) as string
}

export function setPropertyString(property: Property, value: string) {
    property.element.value = value
}

export function createPropertyInputs(properties: Property[]) {
    for (let i = 0; i < properties.length; i++) {
        let inputSelect = 'normal'
        let divLabelSelect = 'normal'
        if (i === 0) {
            inputSelect = 'top'
        }
        if (i === properties.length - 1) {
            divLabelSelect = 'bottom'
        }

        createPropertyInput(inputHTML[inputSelect], divLabelHTML[divLabelSelect], properties[i])
    }
}

export function createPropertyInput(inputText: string, inputLabel: string, property: Property) {
    const propertyInput = htmlToElement(inputText) as HTMLInputElement
    const propertyInputLabel = htmlToElement(inputLabel)

    propertyInputLabel.innerHTML = property.displayName

    property.element = propertyInput
    propertyInputDiv.appendChild(propertyInput)
    propertyInputDiv.appendChild(propertyInputLabel)

    if (property.type === 'number') {
        // NEXT drag controls for property input

        propertyInput.addEventListener('input', (event) => onPropertyTypeNumber(event, property))
        if (property.displayName === '# of Frames') {
            // TODO change the calculation to only take into account the sign of the deltaY (to only step the frame count by 1 or -1)
            propertyInput.addEventListener('wheel', (event) => onPropertyScrollNumber(event, property, 1 / 200))
        } else if (property.displayName.endsWith('Rotation')) {
            // TODO change the calculation to only take into account the sign of the deltaY (to only step the frame count by 1 or -1)
            propertyInput.addEventListener('wheel', (event) => onPropertyScrollNumber(event, property, Math.PI / 180))
        } else {
            propertyInput.addEventListener('wheel', (event) => onPropertyScrollNumber(event, property, 1 / 4000))
        }
        setPropertyNumber(property, 0)

        propertyInput.classList.add('property-input-type-number')
    } else if (property.type === 'string') {
        propertyInput.addEventListener('input', (event) => onPropertyTypeString(event, property))
        setPropertyString(property, '')
    }

    propertyInput.focus()
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
}

function onPropertyTypeNumber(event: Event, property: Property) {
    event.preventDefault()

    let cleaned = cleanNumber((event.target as HTMLInputElement).value, truncateNumber)

    if (cleaned === false) {
        property.element.value = cleanNumber(property.get(), truncateNumber) as string
    } else {
        property.set(frame, toNumber(cleaned))
        property.preview(toNumber(cleaned))
        setPropertyNumber(property, property.get() as number)
    }
}

function onPropertyTypeString(event: Event, property: Property) {
    event.preventDefault()

    let value = (event.target as HTMLInputElement).value

    property.set(frame, value)
    property.preview(value)

    tweenFrames()

    setPropertyString(property, property.get() as string)
}

function onPropertyScrollNumber(event: Event, property: Property, multiple: number) {
    let newVal = 0

    newVal = (property.get() as number) - (event as WheelEvent).deltaY * multiple

    property.set(frame, newVal)
    property.preview(newVal)
    setPropertyNumber(property, property.get() as number)
}

'use strict'

// CONSTANT sort variables
// CONSTANT sort functions by alphabetical order
// CONSTANT compartmentalize nested ifs/whiles/fors/etc into sub functions
// CONSTANT convert as many "let" into "const" as possible
// CONSTANT clean all unused imports
// CONSTANT annotate why each function exists
// CONSTANT remove as many 'document.getelementbyid' as possible
// NEXT limit usable entities to only ones that work
// TODO advanced options such as "preloading" where entities such as cows can look beyond their limits
// TODO look into parsing java code[by running it?] into models (Java Edition)
// TODO fake player (using player_head)
// TODO fake custom entities (using player_head)

import _ from 'lodash'

import { loadModelList } from './model_loader'

import { deselect, highlightedPart, initControls, updateReferences, useControls } from './controls'

import { fps, frame, nextFrame, setFrame, setFrameAmount, setTimelineBar, timelineSelectBar } from './frames'

import { searchElement, onSearch, onSearchType, initInput, searchInputElement } from './input'
import { composer, initRender, resizeWindow } from './render'
import { clock, lastFrame, playing, setLastFrame } from './util'
import { initArmor } from './armor'
import { updateAllKeyframes } from './keyframes'
import { movement, resetCamera, updateCamOrbit } from './camera'

window.addEventListener('contextmenu', (e) => {
    e.preventDefault()
})

window.addEventListener('resize', onWindowResize)
function onWindowResize() {
    resizeWindow()

    setFrame(frame)
    setTimelineBar(frame)
    updateAllKeyframes()
}

async function init() {
    setFrameAmount(20)

    initRender()
    initControls()
    initArmor()
    initInput()

    setFrame(0)
    setTimelineBar(frame)

    searchElement.addEventListener('submit', onSearch)
    searchElement.addEventListener('input', onSearchType)
    document.getElementById('search-input').focus()

    loadModelList()

    document.getElementById('timeline').addEventListener('mousedown', timelineSelectBar)

    deselect()

    searchInputElement.focus()

    resizeWindow()

    resetCamera()
}

const animate = function () {
    requestAnimationFrame(animate)

    // TODO make more accurate timing system
    let curTime = clock.getElapsedTime()
    if (playing && curTime - lastFrame > 1 / fps) {
        setLastFrame(curTime)
        nextFrame()
    }

    if (highlightedPart !== null) {
        updateCamOrbit(highlightedPart)
    }

    movement()
    useControls()
    updateReferences()

    composer.render()
}

init()

animate()

/**
 * Copyright 2016 Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain a copy
 * of the license at https://github.com/palantir/blueprint/blob/master/LICENSE
 * and https://github.com/palantir/blueprint/blob/master/PATENTS
 */

// tslint:disable max-classes-per-file

import { Keys } from "@blueprintjs/core";
import { Browser } from "@blueprintjs/core/dist/compatibility";
import * as React from "react";
import * as ReactDOM from "react-dom";

export type MouseEventType = "click" | "mousedown" | "mouseup" | "mousemove" | "mouseenter" | "mouseleave" ;
export type KeyboardEventType = "keypress" | "keydown" |  "keyup" ;

function getKeyCode(key: string) {
    if (key == null) {
        return undefined;
    }
    if (key.length === 1) {
        return key.charCodeAt(0);
    }
    switch (key) {
        case "up": return Keys.ARROW_UP;
        case "down": return Keys.ARROW_DOWN;
        case "left": return Keys.ARROW_LEFT;
        case "right": return Keys.ARROW_RIGHT;
        // developers: if you need to add more key-code mappings here, feel free to rework
        default: return undefined;
    }
}

function dispatchTestKeyboardEvent(target: EventTarget, eventType: string, key: string, modKey = false) {
    const event = document.createEvent("KeyboardEvent");
    debugger;
    const keyCode = getKeyCode(key);
    console.log("dispatchTestKeyboardEvent", "eventType:", eventType, "key:", key, "modKey:", modKey, "keyCode:", keyCode);

    let ctrlKey = false;
    let metaKey = false;

    if (modKey) {
        if ((typeof navigator !== "undefined") && /Mac|iPod|iPhone|iPad/.test(navigator.platform)) {
            metaKey = true;
        } else {
            ctrlKey = true;
        }
    }

    (event as any).initKeyboardEvent(eventType, true, true, window, key, 0, ctrlKey, false, false, metaKey);
    console.log("Modifying event", event.key, event.which, event.keyCode);
    // Hack around these readonly properties in WebKit and Chrome
    if (Browser.isWebkit()) {
        console.log("  a");
        (event as any).key = key;
        (event as any).which = keyCode;
        (event as any).keyCode = keyCode;
    } else {
        console.log("  b");
        Object.defineProperty(event, "key", { get: () => key });
        Object.defineProperty(event, "which", { get: () => keyCode });
        Object.defineProperty(event, "keyCode", { get: () => keyCode });
    }
    console.log("Dispatching event", event.key, event.which, event.keyCode);
    target.dispatchEvent(event);
}

// TODO: Share with blueprint-components #27

export class ElementHarness {
    public static document() {
        return new ElementHarness(document.documentElement);
    }

    public element: Element;

    constructor(element: Element) {
        this.element = element;
    }

    public exists() {
        return this.element != null;
    }

    public find(query: string, nth?: number) {
        return new ElementHarness(this.findElement(query, nth));
    }

    public hasClass(className: string) {
        return this.element.classList.contains(className);
    }

    public bounds() {
        return this.element.getBoundingClientRect();
    }

    public text() {
        return this.element.textContent;
    }

    public style() {
        return (this.element as HTMLElement).style;
    }

    public focus() {
        (this.element as HTMLElement).focus();
        return this;
    }

    public blur() {
        (this.element as HTMLElement).blur();
        return this;
    }

    public mouse(eventType: MouseEventType = "click", offsetX = 0, offsetY = 0, isMetaKeyDown = false) {
        const bounds = this.bounds();
        const x = bounds.left + bounds.width / 2 + offsetX;
        const y = bounds.top + bounds.height / 2 + offsetY;
        const event = document.createEvent("MouseEvent");

        // The crazy long list of arguments below are defined in this ancient web API:
        // event.initMouseEvent(
        //     type, canBubble, cancelable, view,
        //     detail, screenX, screenY, clientX, clientY,
        //     ctrlKey, altKey, shiftKey, metaKey,
        //     button, relatedTarget
        // );
        event.initMouseEvent(
            eventType, true, true, window,
            null, 0, 0, x, y,
            isMetaKeyDown, false, false, isMetaKeyDown,
            0, null,
        );
        this.element.dispatchEvent(event);
        return this;
    }

    public keyboard(eventType: KeyboardEventType = "keypress", key = "", modKey = false) {

        dispatchTestKeyboardEvent(this.element, eventType, key, modKey);
        return this;
    }

    public change(value?: string) {
        if (value != null) {
            (this.element as HTMLInputElement).value = value;
        }

        // Apparently onChange listeners are listening for "input" events.
        const event = document.createEvent("HTMLEvents");
        event.initEvent("input", true, true);
        this.element.dispatchEvent(event);
        return this;
    }

    private findElement(query: string, nth?: number) {
        if (nth != null) {
            return this.element.querySelectorAll(query)[nth];
        } else {
            return this.element.querySelector(query);
        }
    }
}

export class ReactHarness {
    private container: HTMLElement;

    constructor() {
        this.container = document.createElement("div");
        document.documentElement.appendChild(this.container);
    };

    public mount(component: React.ReactElement<any>) {
        ReactDOM.render(component, this.container);
        return new ElementHarness(this.container);
    }

    public unmount() {
        ReactDOM.unmountComponentAtNode(this.container);
    }

    public destroy() {
        document.documentElement.removeChild(this.container);
        delete this.container;
    }
}

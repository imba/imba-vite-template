import {it, expect} from 'vitest'
import {add} from "./utils.imba"

it "add", do
	expect(add()).toBe 0
	expect(add(1)).toBe 3
	expect(add(1, 2, 3)).toBe 6

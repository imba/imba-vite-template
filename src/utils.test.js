
/*body*/
import {it,expect} from 'vitest';
import {add} from "./utils.imba";

it("add",function() {
	
	expect(add()).toBe(0);
	expect(add(1)).toBe(3);
	return expect(add(1,2,3)).toBe(6);
});

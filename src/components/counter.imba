export default tag Counter < button
	prop count = 0
	<self @click=count++> `Count is {count}`

if import.meta.vitest
	const {getByText,waitFor, queryByText } = await import('@testing-library/dom')
	const {it, expect, describe} = import.meta.vitest
	describe "counter", do
		it "renders a button" do
			const container = <div>
			imba.mount <Counter>, container
			const el = await getByText(container, "Count is 0")
			expect(el).toBeDefined()
			el.click!
			waitFor do expect(queryByText(container, "Count is 1")).toBeDefined!

import React, { useState, useRef } from 'react'
import ReactDOM from 'react-dom'
import Blackboard from '../src/index'
import plugins from '../src/plugins'
const App = () => {
	const [action, setAction] = useState('pencil')
	return (
		<div>
			<button onClick={() => setAction('hand')}>手</button>
			<button onClick={() => setAction('pencil')}>铅笔</button>
			<button onClick={() => setAction('rect')}>矩形</button>
			<button onClick={() => setAction('circle')}>圆</button>
			<button onClick={() => setAction('line')}>直线</button>
			<button onClick={() => setAction('move')}>移动</button>
			<button onClick={() => setAction('eraser')}>橡皮擦</button>
			<Blackboard
				action={action}
				height={900}
				width={1000}
				plugins={plugins}
				resetStyle={{
					drawStyle: {},
					eraserStyle: {},
				}}
			/>
		</div>
	)
}

ReactDOM.render(<App />, document.querySelector('#app'))

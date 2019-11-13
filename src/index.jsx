import React, { useState, useRef, useEffect } from 'react'
import * as d3 from 'd3-shape'
import './index.less'

const defaultPlugin = [
	{
		action: 'hand',
	},
	{
		action: 'pencil',
		style: {
			strokeStyle: 'red',
			lineWidth: 10,
		},
		draw: function(ctx, points, style) {
			ctx.save()
			ctx.beginPath()
			if (style) {
				for (let s in style) {
					ctx[s] = style[s]
				}
			}
			const line = d3.line()
			line.curve(d3.curveBasis)
			line.context(ctx)(points)
			ctx.stroke()
			// ctx.fill()
			ctx.restore()
		},
	},
]

// 默认绘制样式
const ds = {
	strokeStyle: 'red',
	lineWidth: 6,
	lineJoin: 'round',
	lineCap: 'round',
	fillStyle: 'none',
}
// 默认橡皮擦样式
const es = {
	lineWidth: 16,
}

function Whiteboard(props) {
	const {
		action = 'pencil',
		height,
		width,
		scale = 1,
		plugins = [],
		resetStyle,
	} = props
	// 声明dom
	const outerCanvas = useRef(null)
	const innerCanvas = useRef(null)
	const canvasList = useRef(null)
	// 存储历史记录
	const [history, setHistory] = useState([])
	// 绘制样式
	let defaultStyle = { ...ds }
	if (resetStyle && resetStyle.drawStyle) {
		defaultStyle = { ...ds, ...resetStyle.drawStyle }
	}
	// 橡皮擦样式
	let eraserStyle = { ...es }
	if (resetStyle && resetStyle.eraserStyle) {
		eraserStyle = { ...es, ...resetStyle.eraserStyle }
	}
	// 绘制动作组合并
	const allPlugins = [...defaultPlugin, ...plugins]
	// 当前动作
	const [currentAction, setCurrentAction] = useState(allPlugins[0])
	// 事件处理以及临时数据存储
	const store = useRef({
		ctxList: [],
		fingerPointList: [],
	})
	const isMouse = useRef(false)
	const handleMousedown = event => {
		event.preventDefault()
		if (currentAction.action === 'hand') {
			return
		}
		isMouse.current = true
		const { offsetX, offsetY } = event.nativeEvent
		const { fingerPointList, ctxList } = store.current
		// 检测这根手指是否存在canvas
		const exitCanvas = canvasList.current.querySelector('.canvas-0')
		if (!exitCanvas) {
			const canvas = document.createElement('canvas')
			canvas.setAttribute('class', `canvas-0`)
			canvas.setAttribute('height', height * 2)
			canvas.setAttribute('width', width * 2)
			canvas.setAttribute('style', `height:${height}px;width:${width}px`)
			canvasList.current.appendChild(canvas)
			ctxList[0] = canvas.getContext('2d')
		}
		if (!fingerPointList[0]) {
			fingerPointList[0] = [[offsetX * 2, offsetY * 2]]
		}
	}
	const handleMousemove = event => {
		event.preventDefault()
		if (!isMouse.current) return
		const { offsetX, offsetY } = event.nativeEvent
		const { fingerPointList, ctxList } = store.current
		fingerPointList[0].push([offsetX * 2, offsetY * 2])
		// 卧槽，卧槽，没有beginpath，clearRect之后，在画，旧痕迹还在
		if (fingerPointList[0].length > 2) {
			if (currentAction.action) {
				ctxList[0].clearRect(0, 0, width * 2, height * 2)
				ctxList[0].save()
				currentAction.draw(ctxList[0], fingerPointList[0], {
					...defaultStyle,
					...currentAction.style,
				})
				ctxList[0].restore()
			}
		}
	}
	const handleMouseup = event => {
		event.preventDefault()
		if (!isMouse.current) return
		isMouse.current = false
		const { fingerPointList, ctxList } = store.current
		if (fingerPointList[0].length > 0) {
			// 获取上下文
			const innerCtx = innerCanvas.current.getContext('2d')
			if (currentAction.action !== 'hand') {
				innerCtx.save()
				currentAction.draw(innerCtx, fingerPointList[0], {
					...defaultStyle,
					...currentAction.style,
				})
				innerCtx.restore()
			}
			// 清空当前手指
			delete fingerPointList[0]
			// 清空当前手指对应canvas的内容
			ctxList[0].clearRect(0, 0, width * 2, height * 2)
		}
	}
	const handleTouchstart = event => {
		event.preventDefault()
		if (currentAction.action === 'hand') {
			return
		}
		const { top, left } = outerCanvas.current.getBoundingClientRect()
		const { fingerPointList, ctxList } = store.current
		const { clientX, clientY, identifier } = event.changedTouches[0]
		// 检测这根手指是否存在canvas
		const exitCanvas = canvasList.current.querySelector(
			`.canvas-${identifier}`,
		)
		if (!exitCanvas) {
			const canvas = document.createElement('canvas')
			canvas.setAttribute('class', `canvas-${identifier}`)
			canvas.setAttribute('height', height * 2)
			canvas.setAttribute('width', width * 2)
			canvas.setAttribute('style', `height:${height}px;width:${width}px`)
			canvasList.current.appendChild(canvas)
			ctxList[identifier] = canvas.getContext('2d')
		}
		if (!fingerPointList[identifier]) {
			fingerPointList[identifier] = [
				[((clientX - left) / scale) * 2, ((clientY - top) / scale) * 2],
			]
		}
		// console.error('event,start', fingerPointList, ctxList)
	}
	const handleTouchmove = event => {
		event.preventDefault()
		const { top, left } = outerCanvas.current.getBoundingClientRect()
		const { fingerPointList, ctxList } = store.current
		const { changedTouches } = event
		for (let i = 0; i < changedTouches.length; i++) {
			const { clientX, clientY, identifier } = changedTouches[i]
			fingerPointList[identifier].push([
				((clientX - left) / scale) * 2,
				((clientY - top) / scale) * 2,
			])
			// 卧槽，卧槽，没有beginpath，clearRect之后，在画，旧痕迹还在
			if (
				fingerPointList[identifier].length > 2 &&
				currentAction.action !== 'hand'
			) {
				ctxList[identifier].clearRect(0, 0, width * 2, height * 2)
				ctx.save()
				currentAction.draw(
					ctxList[identifier],
					fingerPointList[identifier],
					currentAction.style,
				)
				ctxList[identifier].stroke()
				ctx.restore()
			}
		}
		// console.error('event,move', event.changedTouches)
	}
	const handleTouchend = event => {
		event.preventDefault()
		const { fingerPointList, ctxList } = store.current
		const { identifier } = event.changedTouches[0]
		if (fingerPointList[identifier].length > 0) {
			// 获取上下文
			const innerCtx = innerCanvas.current.getContext('2d')
			if (currentAction.action !== 'hand') {
				innerCtx.beginPath()
				if (currentAction.style) {
					for (let s in currentAction.style) {
						innerCtx[s] = currentAction.style[s]
					}
				}
				currentAction.draw(innerCtx, fingerPointList[identifier])
				// innerCtx.closePath()
				innerCtx.stroke()
			}
			// 清空当前手指
			delete fingerPointList[identifier]
			// 清空当前手指对应canvas的内容
			ctxList[identifier].clearRect(0, 0, width * 2, height * 2)
		}
		// console.log('event,end', event.changedTouches)
	}
	// 设置动作
	useEffect(() => {
		const plugin = allPlugins.find(item => item.action === action)
		setCurrentAction(plugin)
	}, [action])
	return (
		<div className="whiteboard" style={{ height, width }}>
			<canvas
				className="inner"
				ref={innerCanvas}
				height={height * 2}
				width={width * 2}
				style={{ height, width }}
			/>
			<div className="canvas-list" ref={canvasList} />
			<canvas
				className="outer"
				ref={outerCanvas}
				height={height * 2}
				width={width * 2}
				style={{ height, width }}
				onMouseDown={handleMousedown}
				onMouseMove={handleMousemove}
				onMouseUp={handleMouseup}
				onMouseOut={handleMouseup}
				onTouchStart={handleTouchstart}
				onTouchMove={handleTouchmove}
				onTouchEnd={handleTouchend}
				onTouchCancel={handleTouchend}
			/>
		</div>
	)
}

export default Whiteboard

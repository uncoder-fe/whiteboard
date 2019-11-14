import React, { useState, useRef, useEffect } from 'react'
import * as d3 from 'd3-shape'
import './index.less'

// 默认插件
const defaultPlugin = [
	{
		action: 'hand',
	},
	{
		action: 'move',
	},
	{
		action: 'eraser',
	},
	{
		action: 'pencil',
		style: {
			strokeStyle: 'blue',
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
	const { action = 'pencil', scale = 1, plugins = [], resetStyle } = props
	const width = props.width * 2
	const height = props.height * 2
	// 声明使用的dom
	const outerCanvas = useRef(null)
	const innerCanvas = useRef(null)
	const canvasList = useRef(null)
	// 默认绘制样式重制
	let defaultStyle = { ...ds }
	if (resetStyle && resetStyle.drawStyle) {
		defaultStyle = { ...ds, ...resetStyle.drawStyle }
	}
	// 默认橡皮擦样式重制
	let eraserStyle = { ...es }
	if (resetStyle && resetStyle.eraserStyle) {
		eraserStyle = { ...es, ...resetStyle.eraserStyle }
	}
	// 绘制动作组合并
	const allPlugins = [...defaultPlugin, ...plugins]
	// 检测是否命中精灵
	const hitSprite = (historyList, ignoreList, x, y) => {
		let copySprite = null
		for (let i = 0; i < historyList.length; i++) {
			const { id, leftTop, rightBottom } = historyList[i]
			if (ignoreList.find(item => item && item.id === id)) continue
			if (
				leftTop[0] < x &&
				x < rightBottom[0] &&
				leftTop[1] < y &&
				y < rightBottom[1]
			) {
				copySprite = Object.assign({}, historyList[i])
				break
			}
		}
		return copySprite
	}
	// 恢复现场
	const reDraw = (historyList, ignoreList = []) => {
		const innerCtx = innerCanvas.current.getContext('2d')
		innerCtx.clearRect(0, 0, width, height)
		for (let i = 0; i < historyList.length; i++) {
			const { id, action, points, style } = historyList[i]
			if (ignoreList.find(item => item && item.id === id)) continue
			innerCtx.save()
			const plugin = allPlugins.find(item => item.action === action)
			plugin.draw(innerCtx, points, style)
			innerCtx.restore()
		}
	}
	// 当前动作
	const [currentAction, setCurrentAction] = useState(allPlugins[0])
	// 事件处理以及数据存储
	const store = useRef({
		ctxList: [],
		fingerPointList: [],
		moveList: [],
		historyList: [],
	})
	// 鼠标事件
	const isMouse = useRef(false)
	const down = (identifier, x, y) => {
		const {
			fingerPointList,
			ctxList,
			moveList,
			historyList,
		} = store.current
		const exitCanvas = canvasList.current.querySelector(
			`.canvas-${identifier}`,
		)
		// 检测这根手指是否存在canvas
		if (!exitCanvas) {
			const canvas = document.createElement('canvas')
			canvas.setAttribute('class', `canvas-${identifier}`)
			canvas.setAttribute('height', height)
			canvas.setAttribute('width', width)
			canvas.setAttribute(
				'style',
				`height:${height / 2}px;width:${width / 2}px`,
			)
			canvasList.current.appendChild(canvas)
			ctxList[identifier] = canvas.getContext('2d')
		}
		if (!fingerPointList[identifier]) {
			fingerPointList[identifier] = [[x, y]]
		}
		if (currentAction.action === 'move') {
			// 找出那个元素
			const exit = hitSprite(historyList, moveList, x, y)
			if (exit) {
				moveList[identifier] = exit
				const { action, points, style } = exit
				// 绘制背景
				reDraw(historyList, moveList)
				// 绘制
				const plugin = allPlugins.find(item => item.action === action)
				ctxList[identifier].clearRect(0, 0, width, height)
				ctxList[identifier].save()
				plugin.draw(ctxList[identifier], points, style)
				ctxList[identifier].restore()
			}
		}
	}
	const move = (identifier, x, y) => {
		const { fingerPointList, ctxList, moveList } = store.current
		fingerPointList[identifier].push([x, y])
		// 卧槽，卧槽，没有beginpath，clearRect之后，再画，旧痕迹还在
		if (fingerPointList[identifier].length > 2) {
			if (
				currentAction.action !== 'hand' &&
				currentAction.action !== 'move' &&
				currentAction.action !== 'eraser'
			) {
				ctxList[identifier].clearRect(0, 0, width, height)
				ctxList[identifier].save()
				currentAction.draw(
					ctxList[identifier],
					fingerPointList[identifier],
					{
						...defaultStyle,
						...currentAction.style,
					},
				)
				ctxList[identifier].restore()
			} else if (currentAction.action === 'move') {
				if (moveList[identifier]) {
					const { action, points, style } = moveList[identifier]
					// 更新坐标位置
					const minX = fingerPointList[identifier][0][0]
					const minY = fingerPointList[identifier][0][1]
					const maxX =
						fingerPointList[identifier][
							fingerPointList[identifier].length - 1
						][0]
					const maxY =
						fingerPointList[identifier][
							fingerPointList[identifier].length - 1
						][1]
					const distanceX = maxX - minX
					const distanceY = maxY - minY
					const newPoints = points.map(item => {
						const newX = item[0] + distanceX
						const newY = item[1] + distanceY
						return [newX, newY]
					})
					// 绘制
					const plugin = allPlugins.find(
						item => item.action === action,
					)
					ctxList[identifier].clearRect(0, 0, width, height)
					ctxList[identifier].save()
					plugin.draw(ctxList[identifier], newPoints, style)
					ctxList[identifier].restore()
				}
			}
		}
	}
	const up = identifier => {
		const {
			fingerPointList,
			ctxList,
			historyList,
			moveList,
		} = store.current
		if (fingerPointList[identifier].length > 2) {
			// 获取上下文
			const innerCtx = innerCanvas.current.getContext('2d')
			if (
				currentAction.action !== 'hand' &&
				currentAction.action !== 'move' &&
				currentAction.action !== 'eraser'
			) {
				innerCtx.save()
				currentAction.draw(innerCtx, fingerPointList[identifier], {
					...defaultStyle,
					...currentAction.style,
				})
				innerCtx.restore()
				// 唯一key
				const handleKey = Math.random()
					.toString(36)
					.slice(2)
				// 计算矩形大小
				let minX, minY, maxX, maxY
				if (currentAction.action === 'pencil') {
					const ax = [
						...fingerPointList[identifier].map(item => item[0]),
					]
					const ay = [
						...fingerPointList[identifier].map(item => item[1]),
					]
					minX = Math.min(...ax)
					minY = Math.min(...ay)
					maxX = Math.max(...ax)
					maxY = Math.max(...ay)
				} else {
					minX = fingerPointList[identifier][0][0]
					minY = fingerPointList[identifier][0][1]
					maxX =
						fingerPointList[identifier][
							fingerPointList[identifier].length - 1
						][0]
					maxY =
						fingerPointList[identifier][
							fingerPointList[identifier].length - 1
						][1]
				}
				historyList.push({
					id: handleKey,
					action: currentAction.action,
					points: fingerPointList[identifier],
					style: {
						...defaultStyle,
						...currentAction.style,
					},
					eraserList: [],
					leftTop: [Math.min(minX, maxX), Math.min(minY, maxY)],
					rightBottom: [Math.max(minX, maxX), Math.max(minY, maxY)],
				})
			} else if (
				currentAction.action === 'move' &&
				moveList[identifier]
			) {
				const { id, points } = moveList[identifier]
				// 更新坐标位置
				const minX = fingerPointList[identifier][0][0]
				const minY = fingerPointList[identifier][0][1]
				const maxX =
					fingerPointList[identifier][
						fingerPointList[identifier].length - 1
					][0]
				const maxY =
					fingerPointList[identifier][
						fingerPointList[identifier].length - 1
					][1]
				const distanceX = maxX - minX
				const distanceY = maxY - minY
				const newPoints = points.map(item => {
					const newX = item[0] + distanceX
					const newY = item[1] + distanceY
					return [newX, newY]
				})
				// 更新数据
				const updateSprite = historyList.find(item => item.id == id)
				updateSprite.leftTop = [
					updateSprite.leftTop[0] + distanceX,
					updateSprite.leftTop[1] + distanceY,
				]
				updateSprite.rightBottom = [
					updateSprite.rightBottom[0] + distanceX,
					updateSprite.rightBottom[1] + distanceY,
				]
				updateSprite.points = newPoints
				// 清空移动的手指
				delete moveList[identifier]
				// 重绘
				reDraw(historyList, moveList)
			}
			// 清空当前手指
			delete fingerPointList[identifier]
			// 清空当前手指对应canvas的内容
			ctxList[identifier].clearRect(0, 0, width, height)
			console.log('moveList', moveList)
		}
	}
	const handleMousedown = event => {
		event.preventDefault()
		if (currentAction.action === 'hand') return
		isMouse.current = true
		const { offsetX, offsetY } = event.nativeEvent
		down(0, offsetX * 2, offsetY * 2)
	}
	const handleMousemove = event => {
		event.preventDefault()
		if (!isMouse.current) return
		const { offsetX, offsetY } = event.nativeEvent
		move(0, offsetX * 2, offsetY * 2)
	}
	const handleMouseup = event => {
		event.preventDefault()
		if (!isMouse.current) return
		isMouse.current = false
		up(0)
	}
	// 触摸屏事件
	const handleTouchstart = event => {
		event.preventDefault()
		if (currentAction.action === 'hand') {
			return
		}
		const { top, left } = outerCanvas.current.getBoundingClientRect()
		const { clientX, clientY, identifier } = event.changedTouches[0]
		console.log('identifier', identifier)
		down(
			identifier,
			((clientX - left) / scale) * 2,
			((clientY - top) / scale) * 2,
		)
		// console.error('event,start', fingerPointList, ctxList)
	}
	const handleTouchmove = event => {
		event.preventDefault()
		const { top, left } = outerCanvas.current.getBoundingClientRect()
		const { changedTouches } = event
		for (let i = 0; i < changedTouches.length; i++) {
			const { clientX, clientY, identifier } = changedTouches[i]
			move(
				identifier,
				((clientX - left) / scale) * 2,
				((clientY - top) / scale) * 2,
			)
		}
		// console.error('event,move', event.changedTouches)
	}
	const handleTouchend = event => {
		event.preventDefault()
		const { identifier } = event.changedTouches[0]
		up(identifier)
		// console.log('event,end', event.changedTouches)
	}
	// 设置动作
	useEffect(() => {
		const plugin = allPlugins.find(item => item.action === action)
		setCurrentAction(plugin)
	}, [action])
	return (
		<div
			className="whiteboard"
			style={{ height: height / 2, width: width / 2 }}
		>
			<canvas
				className="inner-canvas"
				ref={innerCanvas}
				height={height}
				width={width}
				style={{ height: height / 2, width: width / 2 }}
			/>
			<div className="canvas-list" ref={canvasList} />
			<canvas
				className="outer-canvas"
				ref={outerCanvas}
				height={height}
				width={width}
				style={{ height: height / 2, width: width / 2 }}
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

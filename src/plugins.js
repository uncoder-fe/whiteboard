const plugins = [
	{
		action: 'rect',
		style: {
			strokeStyle: 'red',
			lineWidth: 10,
			fillStyle: '#F4606C',
		},
		draw: function(ctx, points, style) {
			ctx.save()
			ctx.beginPath()
			if (style) {
				for (let s in style) {
					ctx[s] = style[s]
				}
			}
			const len = points.length
			const [startX, startY] = points[0]
			const [endX, endY] = points[len - 1]
			const x = Math.min(startX, endX)
			const y = Math.min(startY, endY)
			const width = Math.abs(endX - startX)
			const height = Math.abs(endY - startY)
			ctx.rect(x, y, width, height)
			ctx.stroke()
			ctx.fill()
			ctx.restore()

			// 辅助线
			ctx.save()
			ctx.beginPath()
			ctx.strokeStyle = 'black'
			ctx.rect(x - 20, y - 20, width + 20 * 2, height + 20 * 2)
			ctx.stroke()
			ctx.restore()
		},
	},
	{
		action: 'line',
		style: {
			strokeStyle: 'red',
			lineWidth: 20,
			fillStyle: 'blue',
		},
		draw: function(ctx, points, style) {
			ctx.save()
			ctx.beginPath()
			if (style) {
				for (let s in style) {
					ctx[s] = style[s]
				}
			}
			const len = points.length
			const [startX, startY] = points[0]
			const [endX, endY] = points[len - 1]
			const x = Math.min(startX, endX)
			const y = Math.min(startY, endY)
			const width = Math.abs(endX - startX)
			const height = Math.abs(endY - startY)
			ctx.moveTo(startX, startY)
			ctx.lineTo(endX, endY)
			ctx.stroke()
			ctx.fill()
			ctx.restore()

			// 辅助线
			ctx.save()
			ctx.beginPath()
			ctx.strokeStyle = 'black'
			ctx.rect(x - 20, y - 20, width + 20 * 2, height + 20 * 2)
			ctx.stroke()
			ctx.restore()
		},
	},
	{
		action: 'circle',
		style: {
			strokeStyle: 'red',
			lineWidth: 2,
			fillStyle: 'none',
		},
		draw: function(ctx, points, style) {
			ctx.save()
			ctx.beginPath()
			if (style) {
				for (let s in style) {
					ctx[s] = style[s]
				}
			}
			const len = points.length
			const [startX, startY] = points[0]
			const [endX, endY] = points[len - 1]
			const x = Math.min(startX, endX)
			const y = Math.min(startY, endY)
			const width = Math.abs(endX - startX)
			const height = Math.abs(endY - startY)
			const center = [
				startX + (endX - startX) / 2,
				startY + (endY - startY) / 2,
			]
			const radiusX = Math.abs((endX - startX) / 2)
			const radiusY = Math.abs((endY - startY) / 2)
			const radius = Math.max(Math.min(radiusX, radiusY), 10)
			ctx.arc(center[0], center[1], radius, 0, 2 * Math.PI)
			ctx.stroke()
			ctx.fill()
			ctx.restore()

			// 辅助线
			ctx.save()
			ctx.beginPath()
			ctx.strokeStyle = 'black'
			ctx.rect(x - 20, y - 20, width + 20 * 2, height + 20 * 2)
			ctx.stroke()
			ctx.restore()
		},
	},
]
export default plugins

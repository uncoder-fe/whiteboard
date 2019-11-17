const plugins = [
	{
		action: 'rect',
		style: {
			strokeStyle: 'red',
			lineWidth: 10,
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
			const [x, y] = points[0]
			const endX = points[len - 1][0]
			const endY = points[len - 1][1]
			ctx.translate(x, y)
			ctx.rect(0, 0, endX - x, endY - y)
			ctx.stroke()
			ctx.fill()
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
			const [x, y] = points[0]
			const endX = points[len - 1][0]
			const endY = points[len - 1][1]
			ctx.moveTo(x, y)
			ctx.lineTo(endX, endY)
			ctx.stroke()
			ctx.fill()
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
			const [x, y] = points[0]
			const endX = points[len - 1][0]
			const endY = points[len - 1][1]
			const center = [x + (endX - x) / 2, y + (endY - y) / 2]
			const radius =
				Math.sqrt((endX - x) * (endX - x) + (endY - y) * (endY - y)) / 4
			ctx.arc(center[0], center[1], radius, 0, 2 * Math.PI)
			ctx.stroke()
			ctx.fill()
			ctx.restore()
		},
	},
]
export default plugins

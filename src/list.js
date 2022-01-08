import Equal from 'fast-deep-equal'
import React from 'react'
import Dragger from './Dragger'

/**
 * 2.4213xxx -> 2
 * 2.62xxx->3
 */
// 这个不就是四舍五入吗
// Math.round好像也可以达到相同的目的
const clamp = x => {
  const num = parseInt(x, 10)
  // 获得小数位
  const left = x - num
  //看看到底是大于 0.5 小于 0.5，
  return left > 0.5 ? num + 1 : num
}

/**
 *  min<num<max
 */
const between = (num, min, max) => {
  return Math.max(min, Math.min(num, max))
}

export default class SortList extends React.Component {
  constructor(props) {
    super(props)

    const data = props.data
    this.state = {
      order: data,
      currentOrder: -1,
      autoScrolling: false
    }
    this.manager = {}
    this.timer = -1
    this.currentX = 0
    this.currentY = 0
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !Equal(this.props, nextProps) || !Equal(nextState, this.state)
  }

  static defaultProps = {
    gap: 80,
    horizontal: false,
    renderItem: () => null
  }

  dragging = (preOrder, x, y, event) => {
    this.currentX = x
    this.currentY = y

    const fixedDirection = this.props.horizontal ? x : y
    const o = clamp(fixedDirection / this.getGap(preOrder.o))
    // preOrder.o 是元素之前的位置
    // o是元素现在计算出来的位置
    const max = this.state.order.length - 1
    const newOrder = this.state.order.map(od => {
      // 如果元素od的位置和计算出来的位置一样
      // 那么将od的位置和当前拖拽元素的位置进行交换
      if (o === od.o) {
        return { ...od, o: preOrder.o }
      }
      // 如果遍历到当前拖拽元素
      // 那么将当前拖拽元素的位置设置为o
      // 这个算法并没有真正改变order的顺序
      // 只是改变了transfromX的值，感觉这样不是很好啊！
      if (preOrder.o === od.o) {
        return { ...od, o: between(o, 0, max) }
      }
      return od
    })

    // 看不懂想干啥 先注释掉
    // if (this.container.scrollTop + 300 - y < 100 && this.timer === -1) {
    //   /**
    //    * 当有已经有滚动的时候，我们需要减去自动滚动前的 scrolltop
    //    */
    //   const currentScrollTop = this.container.scrollTop
    //   const scrollOffsetY = event.clientY / 80

    //   this.timer = setInterval(() => {
    //     const max = this.state.order.length - 1
    //     if (this.state.currentOrder >= max) {
    //       return
    //     }

    //     const nextY =
    //       this.currentY + this.container.scrollTop - currentScrollTop

    //     //自动滚动
    //     this.manager[preOrder.name].autoMove(this.currentX, nextY)
    //     //设置滚动
    //     this.container.scrollTop += scrollOffsetY

    //     const o = clamp(nextY / this.getGap(preOrder.o))

    //     const newOrder = this.state.order.map(od => {
    //       if (preOrder.name === od.name) {
    //         return { ...od, o: o }
    //       }
    //       if (preOrder.name !== od.name && o === od.o) {
    //         return { ...od, o: between(o - 1, 0, max) }
    //       }
    //       return od
    //     })

    //     this.setState({
    //       currentOrder: o,
    //       order: newOrder,
    //       autoScrolling: true
    //     })

    //     if (
    //       nextY - this.container.scrollTop < 150 &&
    //       this.state.autoScrolling
    //     ) {
    //       clearInterval(this.timer)

    //       this.timer = -1
    //       this.setState({
    //         autoScrolling: false
    //       })
    //     }
    //   }, 5)
    // }

    // 拖拽的时候交换位置
    // 设置现在正在拖拽的元素order
    if (!this.state.autoScrolling) {
      this.setState({
        currentOrder: preOrder.o,
        order: newOrder
      })
    }
  }

  dragEnd = () => {
    clearInterval(this.timer)
    this.timer = -1
    this.setState({
      currentOrder: -1,
      autoScrolling: false
    })
  }

  getGap = () => {
    return this.props.gap
  }

  render() {
    return (
      <div
        ref={node => (this.container = node)}
        style={{ height: 500, overflow: 'scroll' }}
      >
        <div style={{ position: 'relative', height: 20 * 100 }}>
          {this.state.order.map(order => {
            //获取当前的实际位置
            const delta = order.o * this.getGap(order.o)
            return (
              <Dragger
                ref={node => (this.manager[order.name] = node)}
                parent={() => this.container}
                onDragMove={(event, x, y) => this.dragging(order, x, y, event)}
                key={order.name}
                x={this.props.horizontal ? delta : 0}
                controlled={this.state.currentOrder !== order.o}
                y={this.props.horizontal ? 0 : delta}
                onDragEnd={this.dragEnd}
              >
                {({ style, handle, dragging }) => {
                  return (
                    <div
                      style={{
                        ...style,
                        position: 'absolute',
                        transition:
                          this.state.currentOrder === order.o ? '' : 'all 0.3s'
                      }}
                    >
                      {this.props.renderItem(handle, order)}
                    </div>
                  )
                }}
              </Dragger>
            )
          })}
        </div>
      </div>
    )
  }
}

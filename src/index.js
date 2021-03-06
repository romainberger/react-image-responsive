import React, {Component, PropTypes} from 'react'
import debounce from 'lodash.debounce'
import objectAssign from 'object-assign'
import isRetina from 'is-retina'
import isClient from 'is-client'

export class Source extends Component {
  static displayName = 'Source'
  render() {
    return null
  }
}

export default class ImageResponsive extends Component {
  static propTypes = {
    src: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    transition: PropTypes.bool.isRequired,
  }
  static defaultProps = {
    style: {},
    type: 'image',
    transition: true
  }
  state = {
    width: false,
    loaded: true,
    src: false
  }
  constructor() {
    super()
    this.src = null
    this.isClient = isClient()
    this.isRetina = isClient && isRetina()
    this.handleResizeDebounced = debounce(this.handleResize, 300).bind(this)
  }
  handleResize() {
    this.setState({'src': this.pickOptimalSource(React.findDOMNode(this.refs.element).offsetWidth, this.props)})
  }
  componentDidMount() {
    if (isClient) {
      this.handleResize()
      window.addEventListener('resize', this.handleResizeDebounced)
      if (this.props.type === 'image' && this.props.transition) {
        React.findDOMNode(this.refs.element).addEventListener('load', ::this.onLoad)
      }
    }
  }
  onLoad() {
    this.setState({loaded: true})
  }
  componentWillUnmount() {
    this.setState({loaded: false})
    if (isClient) {
      window.removeEventListener('resize', this.handleResizeDebounced)
    }
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.src && nextProps.src !== this.props.src) {
        this.setState({'src': this.pickOptimalSource(React.findDOMNode(this.refs.element).offsetWidth, nextProps)})
    }
  }
  pickOptimalSource(width, props) {
    let sources = props.children.filter(this.isSource).sort((a, b) => a.props.maxWidth > b.props.maxWidth)
    let resultSource
    for (let source of sources) {
      let maxWidth = this.isRetina ? source.props.maxWidth / 2 : source.props.maxWidth
      if (width < maxWidth) {
        resultSource = source
      }
    }
    return resultSource ? resultSource.props.src : this.props.src
  }
  isSource(item) {
    return item.type.displayName && item.type.displayName === 'Source'
  }
  notSource(item) {
    return !this.isSource(item)
  }
  render() {
    let style = {}
    if (this.props.transition) {
      if (this.props.type === 'image') {
        style.transition = 'opacity .2s ease-in-out'
      }
    }
    if (this.props.type === 'image') {
      style.opacity = this.state.loaded ? 1 : 0
    }
    else if (this.props.type === 'background-image') {
        style.backgroundSize = '100% 100%'
        style.backgroundImage = `url('${this.state.src}')`
        if (this.props.width) {
          style.width = this.props.width
        }
        if (this.props.height) {
          style.height = this.props.height
        }
    }
    style = objectAssign(style, this.props.style)
    let filteredChildren = this.props.children.filter(::this.notSource)
    return this.props.type === 'image'
        ? <img ref="element" {...this.props} src={this.state.src} style={style}>{filteredChildren}</img>
        : <div ref="element" {...this.props} style={style}>{filteredChildren}</div>
  }
}

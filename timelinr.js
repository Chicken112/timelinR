class TimelinR{
    constructor(element, arr, options){
        this.data = arr
        this.element = element
        this.options = Object.assign({
            start: 0,
            zoom: 1,
            maxZoom: 1,
            minZoom: 60,
            minOffset: 0, //Sould not be changed
            maxOffset: 60,
            showCurrentTime: true,
            canModify: true,
            backgroundCollapseAt: 20,
            backgroundCollapse: 10,
            labelText: i => {return i},
            onZoomChanged: val => {return val},
            onOffsetChanged: val => {return val},
            onDataChanged: data => {}
        }, options)
        
        const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

        //Zooming
        this.zoom = this.options.zoom
        this.setZoom = (val) => {
            const maxPossibleWidth = this.options.maxOffset - this.options.minOffset + 1
            this.zoom = clamp(val, this.options.maxZoom, this.options.minZoom < maxPossibleWidth ? this.options.minZoom : maxPossibleWidth)
            this.Draw()
        }

        this.setMaxOffset = (val) => {
            this.options.maxOffset = val
            if(this.offset > val){
                this.offset = val
            }
            const maxPossibleWidth = this.options.maxOffset - this.options.minOffset + 1
            this.zoom = clamp(this.zoom, this.options.maxZoom, this.options.minZoom < maxPossibleWidth ? this.options.minZoom : maxPossibleWidth)

            this.Draw()
        }
        
        //Offset
        this.offset = this.options.start
        this.setOffset = (val) => {
            this.offset = clamp(val, this.options.minOffset, this.options.maxOffset - this.zoom + 1)
            this.Draw()
        }

        this.setData = (newData) => {
            this.data = newData
            this.Draw()
        }
        
        this.getData = () => {
            return this.data
        }

        this.element.classList.add('timelinR')
        if(!this.options.canModify){
            this.element.classList.add('static')
        }

        //Scroll wheel
        this.element.addEventListener('wheel', (e) => {
            if(e.ctrlKey){
                //Zooming
                e.preventDefault()
                const maxPossibleWidth = this.options.maxOffset - this.options.minOffset + 1
                this.zoom = clamp(this.zoom + e.deltaY * 0.01, this.options.maxZoom, this.options.minZoom < maxPossibleWidth ? this.options.minZoom : maxPossibleWidth)
                this.options.onZoomChanged(this.zoom)
                this.offset = clamp(this.offset, this.options.minOffset, this.options.maxOffset - this.zoom + 1)
                this.options.onOffsetChanged(this.offset)
            }else{
                //Panning
                this.offset = clamp(e.deltaY * 0.01 + this.offset, this.options.minOffset, this.options.maxOffset - this.zoom + 1)
                this.options.onOffsetChanged(this.offset)
            }
            this.Draw()
        })

        //Dragging
        let dragType = "none" //pan, move, resize-l, resize-r, none
        let dragItem = null;
        let dragPos = null;
        let movedCursor = false
        this.element.addEventListener('mousedown', (e) => {
            if(e.target.classList.contains('resize')){
                dragItem = e.target.parentElement
                dragType = "resize-" + (e.target.classList.contains('l') ? 'l' : 'r')
            } else if(e.target.parentElement.classList.contains('item') && this.options.canModify){
                dragType = "move"
                dragItem = e.target.parentElement
            } else{
                dragType = "pan"
            }
            dragPos = e.clientX
        })
        window.addEventListener('mousemove', (e) => {
            if(dragType == "none"){ return; }
            if(dragType == "resize-l"){
                const currentTransform = parseInt(dragItem.style.transform.match(/\((.+?)\)/g)[0].slice(1, -3))
                const currentWidth = parseInt(dragItem.style.width.slice(0, -2))
                dragItem.style.transform = `translateX(${currentTransform + (e.clientX - dragPos)}px)`
                dragItem.style.width = `${currentWidth - (e.clientX - dragPos)}px`
            }else if(dragType == "resize-r"){
                const current = parseInt(dragItem.style.width.slice(0, -2))
                dragItem.style.width = `${current + (e.clientX - dragPos)}px`
            }else if(dragType == "move"){
                movedCursor = true
                const current = parseInt(dragItem.style.transform.match(/\((.+?)\)/g)[0].slice(1, -3))
                dragItem.style.transform = `translateX(${current + (e.clientX - dragPos)}px)`
            } else{
                const divSize = this.element.offsetWidth / this.zoom
                this.offset = clamp(this.offset - (e.clientX - dragPos) / divSize, this.options.minOffset, this.options.maxOffset - this.zoom + 1)
                this.options.onOffsetChanged(this.offset)
                this.Draw()
            }
            dragPos = e.clientX
        })
        window.addEventListener('mouseup', (e) => {
            dragPos = null
            if(dragType == "move"){
                //Dragged element
                if(movedCursor){
                    const divSize = this.element.offsetWidth / this.zoom
                    const current = parseInt(dragItem.style.transform.match(/\((.+?)\)/g)[0].slice(1, -3))
                    const value = clamp(Math.round((current + (this.offset % 1 * divSize)) / divSize + Math.floor(this.offset)), this.options.minOffset, this.options.maxOffset)
                    const dataIndex = parseInt(dragItem.getAttribute('data-index'))
                    if(this.data[dataIndex].to){
                        const dataRangeOfset = this.data[dataIndex].to - this.data[dataIndex].from
                        this.data[dataIndex].to = value + dataRangeOfset
                    }
                    this.data[dataIndex].from = value
                    this.options.onDataChanged(this.data)
                    this.Draw()
                }
            } else if(dragType == "resize-r"){
                const divSize = this.element.offsetWidth / this.zoom
                const value = clamp(Math.round(dragItem.style.width.slice(0, -2) / divSize), this.options.minOffset, this.options.maxOffset)
                const dataIndex = parseInt(dragItem.getAttribute('data-index'))
                this.data[dataIndex].to = this.data[dataIndex].from + value
                this.options.onDataChanged(this.data)
                this.Draw()
            } else if(dragType == "resize-l"){
                const divSize = this.element.offsetWidth / this.zoom
                const current = parseInt(dragItem.style.transform.match(/\((.+?)\)/g)[0].slice(1, -3))
                const value = clamp(Math.round((current + (this.offset % 1 * divSize)) / divSize + Math.floor(this.offset)), this.options.minOffset, this.options.maxOffset)
                const dataIndex = parseInt(dragItem.getAttribute('data-index'))
                this.data[dataIndex].from = value
                this.options.onDataChanged(this.data)
                this.Draw()
            }
            dragType = "none"
            dragItem = null
            movedCursor = false
        })


        //Currenttime
        this.currentTime = 0
        this.setCurrentTime = (n, scrollto=true) => {
            const width = this.element.offsetWidth
            const divSize = width/this.zoom
            const viewportFrom = Math.floor(this.offset)
            const viewportTo = Math.ceil(Math.floor(this.offset) + width / divSize)
            if(!(n >= viewportFrom && n < viewportTo) && scrollto){
                this.setOffset(n)
            }
            this.currentTime = n
            this.Draw()
        }

        //Editing items
        window.addEventListener('keydown', (e) => {
            if(this.options.canModify && e.target.parentElement.classList.contains('item') && e.target.getAttribute('contenteditable') == "true") { //tf js? why would you do it like that
                if(e.key == 'Enter'){
                    e.preventDefault()
                }
            }
        })
        window.addEventListener('keyup', (e) => {
            if(this.options.canModify && e.target.parentElement.classList.contains('item') && e.target.getAttribute('contenteditable') == "true") { //tf js? why would you do it like that
                //FIXME somehow called twice on keypress with 'data' not being complete?
                const dataIndex = parseInt(e.target.parentElement.getAttribute('data-index'))
                this.data[dataIndex].text = e.target.textContent
                this.options.onDataChanged(this.data)
            }

        })

        //Resize
        this.onResize = () => {
            this.Draw()
        }
        new ResizeObserver(this.onResize).observe(this.element)

        //Black magic
        this.Draw = () => {
            const width = this.element.offsetWidth
            const divSize = width/this.zoom
            const viewportFrom = Math.floor(this.offset)
            const viewportTo = Math.ceil(Math.floor(this.offset) + width / divSize)

            const fragment = new DocumentFragment();
            
            //Grid constructed with divs
            for (let i = 0; i < width / divSize + 1; i++) {
                if(viewportTo - viewportFrom >= this.options.backgroundCollapseAt && !((Math.floor(this.offset) + i) % this.options.backgroundCollapse == 0)){
                    continue
                }
                const div = document.createElement('div')
                div.classList.add('background')
                div.style.width = divSize + 'px'
                div.style.transform = `translateX(${i*divSize - (this.offset % 1 * divSize)}px)`
                const p = document.createElement('p')
                p.setAttribute('unselectable', true)
                p.textContent = this.options.labelText(Math.floor(this.offset) + i)
                div.appendChild(p)
                fragment.append(div)
                //innerHtml += `<div class="background" style="width: ${divSize}px; transform: translateX(${i*divSize - (this.offset % 1 * divSize)}px)"><p unselectable="on" onselectstart="return false">${this.options.labelText(Math.floor(this.offset) + i)}</p></div>`
            }

            //Data elements
            this.data.forEach((elem, i) => {
                if(elem.to){
                    //range
                    if(elem.from > viewportTo || elem.to < viewportFrom){ return }
                    
                    const leftPixelsOffset = (elem.from - viewportFrom) * divSize - (this.offset % 1 * divSize)
                    const rightPixelsOffset = (elem.to - viewportFrom) * divSize - (this.offset % 1 * divSize)

                    const div = document.createElement('div')
                    div.classList.add('item', 'range')
                    div.setAttribute('data-index', i)
                    div.style.width = rightPixelsOffset-leftPixelsOffset - (this.options.canModify ? 0 : 5) + 'px'
                    div.style.transform = `translateX(${leftPixelsOffset}px)`
                    div.innerHTML = `<div ${this.options.canModify ? 'class="resize l"' : ""}></div><p ${this.options.canModify ? 'contenteditable="true"' : ""}>${elem.text}</p>${this.options.canModify ? '<div class="resize r">' : ""}</div>`
                    fragment.append(div)
                    //innerHtml += `<div class="item range" data-index="${i}" style="width: ${rightPixelsOffset-leftPixelsOffset - (this.options.canModify ? 0 : 5)}px; transform: translateX(${leftPixelsOffset}px)"><div ${this.options.canModify ? 'class="resize l"' : ""}></div><p ${this.options.canModify ? 'contenteditable="true"' : ""}>${elem.text}</p>${this.options.canModify ? '<div class="resize r">' : ""}</div></div>`
                }else{
                    //single point
                    if(!(elem.from >= viewportFrom && elem.from <= viewportTo)) { return }

                    const div = document.createElement('div')
                    div.classList.add('item', 'point')
                    div.setAttribute('data-index', i)
                    div.style.transform = `translateX(${(elem.from - viewportFrom) * divSize - (this.offset % 1 * divSize)}px)`
                    const p = document.createElement('p')
                    p.setAttribute('contenteditable', this.options.canModify)
                    p.textContent = elem.text
                    div.appendChild(p)
                    fragment.append(div)
                    //innerHtml += `<div class="item point" data-index="${i}" style="transform: translateX(${(elem.from - viewportFrom) * divSize - (this.offset % 1 * divSize)}px)"><p ${this.options.canModify ? 'contenteditable="true"' : ""}>${elem.text}</p></div>`
                }
            });


            //Currenttime
            if(this.options.showCurrentTime){
                if(this.currentTime >= viewportFrom && this.currentTime <= viewportTo){
                    const div = document.createElement('div')
                    div.classList.add('currenttime')
                    div.style.transform = `translateX(${(this.currentTime - viewportFrom) * divSize - (this.offset % 1 * divSize)}px)`
                    fragment.append(div)
                    //innerHtml += `<div class="currenttime" style="transform: translateX(${(this.currentTime - viewportFrom) * divSize - (this.offset % 1 * divSize)}px)"></div>`
                }
            }

            this.element.innerHTML = ""
            this.element.append(fragment)
            //this.element.innerHTML = innerHtml
        }
    }
}
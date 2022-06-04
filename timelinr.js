class TimelineR{
    constructor(element, data, options){
        this.element = element
        this.options = Object.assign({
            start: 0,
            zoom: 1,
            maxZoom: 1,
            minZoom: 60,
            minOffset: 0, //Sould not be changed
            maxOffset: 60,
            labelText: i => {return i}
        }, options)
        
        this.clamp = (num, min, max) => Math.min(Math.max(num, min), max);

        this.zoom = this.options.zoom
        this.offset = this.options.start
        this.element.classList.add('timelinR')

        // data.sort((a, b) => {
        //     return a.from - b.from
        // })

        //Scroll wheel
        this.element.addEventListener('wheel', (e) => {
            if(e.ctrlKey){
                //Zooming
                e.preventDefault()
                this.zoom = this.clamp(this.zoom + e.deltaY * 0.01, this.options.maxZoom, this.options.minZoom)
                this.offset = this.clamp(this.offset, this.options.minOffset, this.options.maxOffset - this.zoom + 1)
            }else{
                //Panning
                this.offset = this.clamp(e.deltaY * 0.01 + this.offset, this.options.minOffset, this.options.maxOffset - this.zoom + 1)
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
            } else if(e.target.parentElement.classList.contains('item')){
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
                //TODO align drag speed with grid
                this.offset = this.clamp(this.offset - (e.clientX - dragPos) * 0.1, this.options.minOffset, this.options.maxOffset - this.zoom + 1)
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
                    const value = this.clamp(Math.round((current + (this.offset % 1 * divSize)) / divSize + Math.floor(this.offset)), this.options.minOffset, this.options.maxOffset)
                    const dataIndex = parseInt(dragItem.getAttribute('data-index'))
                    if(data[dataIndex].to){
                        const dataRangeOfset = data[dataIndex].to - data[dataIndex].from
                        data[dataIndex].to = value + dataRangeOfset
                    }
                    data[dataIndex].from = value
                    this.Draw()
                }
            } else if(dragType == "resize-r"){
                const divSize = this.element.offsetWidth / this.zoom
                const value = this.clamp(Math.round(dragItem.style.width.slice(0, -2) / divSize), this.options.minOffset, this.options.maxOffset)
                const dataIndex = parseInt(dragItem.getAttribute('data-index'))
                data[dataIndex].to = data[dataIndex].from + value
                this.Draw()
            } else if(dragType == "resize-l"){
                const divSize = this.element.offsetWidth / this.zoom
                const current = parseInt(dragItem.style.transform.match(/\((.+?)\)/g)[0].slice(1, -3))
                const value = this.clamp(Math.round((current + (this.offset % 1 * divSize)) / divSize + Math.floor(this.offset)), this.options.minOffset, this.options.maxOffset)
                const dataIndex = parseInt(dragItem.getAttribute('data-index'))
                data[dataIndex].from = value
                this.Draw()
            }
            dragType = "none"
            dragItem = null
            movedCursor = false
        })

        //Editing items
        window.addEventListener('keydown', (e) => {
            if(e.target.parentElement.classList.contains('item') && e.target.getAttribute('contenteditable') == "true") { //tf js? why would you do it like that
                if(e.key == 'Enter'){
                    e.preventDefault()
                }
            }
        })
        window.addEventListener('keyup', (e) => {
            if(e.target.parentElement.classList.contains('item') && e.target.getAttribute('contenteditable') == "true") { //tf js? why would you do it like that
                saveContent()
            }
            
            function saveContent(){
                const dataIndex = e.target.parentElement.getAttribute('data-index')
                data[dataIndex].text = e.target.textContent
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

            let innerHtml = ''
            
            //Grid constructed with divs
            const divSize = width/this.zoom
            for (let i = 0; i < width / divSize + 1; i++) {
                innerHtml += `<div class="background" style="width: ${divSize}px; transform: translateX(${i*divSize - (this.offset % 1 * divSize)}px)"><p>${this.options.labelText(Math.floor(this.offset) + i)}</p></div>`
            }

            //Data elements
            const viewportFrom = Math.floor(this.offset)
            const viewportTo = Math.ceil(Math.floor(this.offset) + width / divSize)
            data.forEach((elem, i) => {
                if(elem.to){
                    //range
                    if(elem.from > viewportTo || elem.to < viewportFrom){ return }
                    
                    const leftPixelsOffset = (elem.from - viewportFrom) * divSize - (this.offset % 1 * divSize)
                    const rightPixelsOffset = (elem.to - viewportFrom) * divSize - (this.offset % 1 * divSize)

                    innerHtml += `<div class="item range" data-index="${i}" style="width: ${rightPixelsOffset-leftPixelsOffset}px; transform: translateX(${leftPixelsOffset}px)"><div class="resize l"></div><p contenteditable="true">${elem.text}</p><div class="resize r"></div></div>`
                }else{
                    //single point
                    if(!(elem.from >= viewportFrom && elem.from <= viewportTo)) { return }
                    innerHtml += `<div class="item point" data-index="${i}" style="transform: translateX(${(elem.from - viewportFrom) * divSize - (this.offset % 1 * divSize)}px)"><p contenteditable="true">${elem.text}</p></div>`
                }
            });
            this.element.innerHTML = innerHtml
        }
    }
}
//#region Types
export type TimeLinROptions = {
    start:number,
    end:number,
    view?:number,
    offset?:number,
    backgroundTickCount?:number,

    canModifyView?:boolean
    canModifyOffset?:boolean

    showCurrentTime?: boolean,
    currentTime?:number,

    scaleText?: (i:number)=>string,
    onClick?: (e)=>void,
    onViewChange?: (val)=>number,
    onOffsetChange?: (val)=>number,
}
export type TimeLinRTDataElement = {
    from:number,
    to?:number,
    text?:string
}
//#endregion

export default class TimelinR{
//#region variable definitions
    data:TimeLinRTDataElement[]
    element:HTMLElement
    start:number
    end:number
    length:number
    view:number
    offset:number
    backgroundTickCount:number
    canModifyView:boolean
    canModifyOffset:boolean
    showCurrentTime:boolean
    currentTime:number
    scaleText: (i:number)=>string
    onClick?: (e)=>void
    onViewChange?: (val)=>number
    onOffsetChange?: (val)=>number
    //#endregion

    constructor(element:HTMLElement, data:TimeLinRTDataElement[], options:TimeLinROptions){
        //TODO clamp values
        this.start = options.start
        this.end = options.end
        this.length = this.end - this.start
        this.view = options.view || options.end - options.start
        this.offset = options.offset || 0
        this.backgroundTickCount = options.backgroundTickCount || 20
        this.canModifyView = options.canModifyOffset || false
        this.canModifyOffset = options.canModifyOffset || false
        this.showCurrentTime = options.showCurrentTime || false
        this.currentTime = options.currentTime || this.start
        this.scaleText = options.scaleText || ((i) => i.toString())
        this.onClick = options.onClick
        this.onViewChange = options.onViewChange
        this.onOffsetChange = options.onOffsetChange

        this.element = element
        this.element.classList.add('timelinR')

        this.data = [...data]

        //Scroll wheel
        this.element.addEventListener('wheel', (e:WheelEvent) => {
            const clampOffset = (delta:number) => {
                this.offset = this.#clamp(this.offset + delta, this.start - this.view/2, this.end - this.view/2)
            }
            const panSensitivity = 0.0005 * this.view //TODO extract
            const zoomSensitivity = 0.0005 * this.view //TODO extract

            if(e.shiftKey && this.canModifyOffset){
                clampOffset(e.deltaY*panSensitivity)
                e.preventDefault()
            } else if(this.canModifyView){
                const xRel = (e.pageX - this.element.offsetLeft)/this.element.offsetWidth
                
                this.view = this.#clamp(this.view + e.deltaY * zoomSensitivity, this.backgroundTickCount, this.length*1.25)
                clampOffset(-e.deltaY * zoomSensitivity * xRel)
                e.preventDefault()
            }
            if(this.canModifyOffset){
                clampOffset(e.deltaX * panSensitivity)
                e.preventDefault()
            }
            this.Draw()
        }, false)

        //Resize
        new ResizeObserver(() => { this.Draw() }).observe(this.element)

        this.Draw()
    }

    #clamp(n:number,min:number,max:number){
        return Math.max(Math.min(n, max), min)
        // return Math.min(Math.max(n, min), max)
    }


    #pow2floor(v) {
        let p = 1
        // eslint-disable-next-line no-cond-assign
        while (v >>= 1) {
            p <<= 1 
        }
        return p
    }

    //This is where the magic happens, kiddo
    Draw = () => {
        let HTML = '<div class="scalebackground"></div>'
        const width = this.element.offsetWidth
        const divSize = width/this.view
        const showEvery = Math.max(this.#pow2floor(this.view/this.backgroundTickCount),1)
        const distanceToBeingVisible = 1 - (this.view/this.backgroundTickCount - showEvery) / showEvery

        //Grid constructed with divs
        for (let i = -1; i < this.view + 1; i++) {
            //Need this because otherwise there'll be a jump near zero
            const offset = (this.offset < 0 ? Math.ceil(this.offset) : Math.floor(this.offset)) + i
            const show = offset % showEvery == 0
            if(!show && Math.abs(offset) % showEvery != showEvery/2){continue}
            const tickOffset = i*divSize - (this.offset%1*divSize)
            const inActiveArea = offset >= this.start && offset <= this.end
            const opacity = !inActiveArea ? 0.3 : show?1:distanceToBeingVisible*0.7
            let div = `<div class="backgroundTick" style="left:${tickOffset}px;opacity:${opacity}"></div>`
            if(show){
                div += `<p style="left:${tickOffset}px;opacity:${inActiveArea?1:0.3}" class="backgoundScale">${this.scaleText(offset)}</p>`
            }
            HTML += div
        }
        
        //Data elements
        const visibleEnd = this.offset + this.view
        const textMargin = 20
        const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
        for (let i = 0; i < this.data.length; i++) {
            const element = this.data[i]
            if(element.from > visibleEnd || (element.to && element.to < this.offset)){continue}
            const itemOffset = (element.from - this.offset)*divSize
            if(element.to){
                const itemWidth = (element.to - element.from)*divSize
                let div = `<div class="item" style="left:${itemOffset}px;width:${itemWidth}px">`
                if(element.text){
                    //Making it sticky
                    const end = (element.to - element.from) * width/this.view - element.text.length * rem
                    const offset = this.#clamp((this.offset - element.from) * width/this.view, 0, end) + textMargin
                    div += `<p class="itemtext scale" style="left:${itemOffset}px;margin-left:${offset}px">${element.text}<p>`
                }
                div += '</div>'
                HTML += div
            }else{
                let div = `<div class="item" style="left:${itemOffset}px">`
                if(element.text){
                    div += `<p class="itemtext point">${element.text}<p>`
                }
                div += '</div>'
                HTML += div

            }
        }


        if(this.showCurrentTime && this.currentTime >= this.start-1 && this.currentTime <= this.end+1){
            const offset = (this.currentTime - this.offset) * divSize
            HTML += `<div class="currenttimeTick" style="left:${offset}px"></div><p class="currenttimeText" style="left:${offset}px">${this.currentTime}</p>`
        }

        this.element.innerHTML = HTML
    }
}
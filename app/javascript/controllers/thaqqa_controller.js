import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
    static targets = ["rendersvg", "renderpath",
        "fixrender","autoupdate",
        "direction","fontsize","language",
        "font", "bundleowner", "bundlename",  //bundle_owner,bundle_name,fontについては後々リスト表示できるようにする
        "width","height",
        "sentence",
        "linebreak","textalign","textalignlast",
        "lineheight","wordspacing","letterspacing"
    ]

  connect() { this.update_letter() }
  auto_update(){ if(this.autoupdateTarget.value){ setTimeout(() => {this.update_letter()},500) } }
  manual_update(){ this.update_letter()} 

  async update_letter(){
    const csrfToken = document
  .querySelector('meta[name="csrf-token"]')
  .content
  
    const res = await fetch(
      "/thaqqa_api/render",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        body: JSON.stringify({
          direction: this.directionTargets.find(r => r.checked).value,
          size: this.fontsizeTarget.value,
          language:this.languageTarget.value,
          font:this.fontTarget.value,
          bundleowner:this.bundleownerTarget.value,
          bundlename:this.bundlenameTarget.value,
          width:this.widthTarget.value,
          height:this.heightTarget.value,
          sentence: this.sentenceTarget.value,
          line_break:this.linebreakTarget.value,
          text_align:this.textalignTarget.value,
          text_align_last: this.textalignlastTarget.value,
          line_height:this.lineheightTarget.value,
          word_spacing:this.wordspacingTarget.value,
          letter_spacing: this.letterspacingTarget.value
        })
      }
    )

    const json = await res.json()
        console.log(json)
    if (json.ok) {
        const d = json.ok.d
        console.log(d)
        this.renderpathTarget.setAttribute("d", d)

    this.rendersvgTarget.setAttribute("width", this.widthTarget.value)
    this.rendersvgTarget.setAttribute("height",this.heightTarget.value)
    this.rendersvgTarget.setAttribute("viewBox", `0 0 ${this.widthTarget.value} ${this.heightTarget.value}`)
  // SVGに反映
    } else {
    console.error(json.error)
    }
  }
  //disconnect() {}
}

import { Controller } from "@hotwired/stimulus"
const READ_ONLY_SUBTYPES = new Set(["id", "path", "regex"])
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content

export default class extends Controller {
    static targets = ["bundleowner", "bundlename","font",  //bundle_owner,bundle_name,fontについては後々リスト表示できるようにする
    "tablehead","tablebody", "tableSelect",]
    
    async connect() {     
        try{
        this.tables = {}
        this.currentTableName = null
        const json = await this.get_prefab() 
        this.parse_json(json,true)

        const firstTable = Object.keys(this.tables)[0]

        if (firstTable) {
            this.currentTableName = firstTable
            this.tableSelectTarget.value = firstTable
            this.render(this.tables[firstTable])
        }

        } catch(error){
            console.error(error)
        }
    }

  async get_prefab() {
  

  try {
    const res = await fetch("/thaqqa_api/prefab/get", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
      },
      body: JSON.stringify({
        bundleowner: this.bundleownerTarget.value,
        bundlename: this.bundlenameTarget.value
      })
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const json = await res.json()

    if (!json.ok) {
        throw new Error(`Prefabの取得に失敗しました:${json.error}`)
    }
    return json
    } catch (error) {
    return error
  }
    }

  parse_json(json_raw,init){
    const prefab = json_raw.ok.prefab
    const staticTables = prefab.static_tables

    const fontTables = prefab.fonts[this.fontTarget.value].table_list

    const filteredStaticTables = Object.fromEntries(
        Object.entries(staticTables).filter(
         ([_, table]) => table.static == false && table.global == true 
        )
    )   // global属性、かつ非static属性のもののみを読み取る

    this.tables = {...structuredClone(filteredStaticTables),...structuredClone(fontTables),}

    if(init){
          this.tableSelectTarget.replaceChildren()

    for (const name of Object.keys(this.tables)) {
      const option = document.createElement("option")
      option.value = name
      option.textContent = name
      this.tableSelectTarget.appendChild(option)
    }

    }
  } 


  change_table(event) {
    this.currentTableName = event.target.value
    this.render(this.tables[this.currentTableName],false)
  }
render(data) {
    const isSingle = data.single === true
    const columns = Object.values(data.columnList)
        .sort((a, b) => a.order - b.order)

const rows = Object.values(data.dataList)
  .sort((a, b) => {
        if (a.Order != null  && a.Order != b.Order){
            return a.Order - b.Order
        } else if (a.Priority != null && a.Priority != b.Priority) {
      return a.Priority - b.Priority
    }
    else {
return a.ID - b.ID
    }
  })

  this.tableheadTarget.replaceChildren()
  this.tablebodyTarget.replaceChildren()

  // ヘッダー
  const headerRow = document.createElement("tr")

  for (const column of columns) {
    const th = document.createElement("th")
    th.textContent = column.name
    th.title = column.desc ?? ""
    if (column.subtype === "id" ) {
        th.style.width = "70px"
    } else if (column.type === "int") {
        th.style.width = "90px"
    } else if (column.type === "bool") {
        th.style.width = "70px"
    } 
    headerRow.appendChild(th)
  }

  const operationHeader = document.createElement("th")
  operationHeader.textContent = "操作"
  headerRow.appendChild(operationHeader)

  this.tableheadTarget.appendChild(headerRow)

  // データ行
  for (const [index, rowData] of rows.entries()) {
    const tr = document.createElement("tr")

    for (const column of columns) {
  const td = document.createElement("td")
  const value = rowData[column.name]

  const readOnly = READ_ONLY_SUBTYPES.has(column.subtype)
//将来的には、この手の選択肢式もelixir側から取得するものとする
if (["alig_x0","alig_x1","alig_y0","language","writing_direction","gpos",].includes(column.subtype)) {
  const input = document.createElement("select")
  input.className = "form-select form-select-sm"

  const options = {"alig_x0":[["内側","-1"], ["中央","0"], ["外側","1"]],
    "alig_x1":[["内側","-1"], ["中央","0"], ["外側","1"]],
    "alig_y0":[["上側","-1"], ["中央","0"], ["下側","1"]],
    "language":[["共通","universal"],["東果語","khehyelu"],["汽陸語","samlhta"]],
    "writing_direction":[["共通","universal"],["縦書き","vertical"],["横書き","horizontal"]],
    "gpos":[["グリフ幅","internal"], ["カーニング","external"], ["音節内配置","kerning"], ["ダイアクリティカルマーク配置","diacritical"]],
  }

  for (const option of options[column.subtype]) {
    const item = document.createElement("option")
    item.value = option[1]
    item.textContent = option[0]
    input.appendChild(item)
  }

  input.value = value ?? ""
  input.disabled = readOnly

  if (!readOnly) {
    input.addEventListener("change", async (event) => { rowData[column.name] = event.target.value;
      await this.edit_row(rowData);
    })
  }

  td.appendChild(input)
} else if (column.type === "bool") {
    // bool 型はチェックボックス
    const input = document.createElement("input")
    input.type = "checkbox"
    input.className = "form-check-input"
    input.checked = Boolean(value)
    input.disabled = readOnly

    if (!readOnly) {
      input.addEventListener("change", async (event) => {
        rowData[column.name] = event.target.checked;
        await this.edit_row(rowData)
      })
    }

    td.classList.add("text-center")
    td.appendChild(input)
  } else if (column.type === "int" || column.type === "float") {
  const input = document.createElement("input")
  input.type = "number"
  input.className = "form-control form-control-sm"
  input.value = value ?? ""
  input.readOnly = readOnly

  if (column.type === "int") {
 input.step = "1"
  } else {
    input.step = "any" // 小数を自由に入力可能
  }

  if (!readOnly) {
    input.addEventListener("change", 
        async (event) => { const value = event.target.value 
            rowData[column.name] = value === "" ? null : Number(value);
          await this.edit_row(rowData);
        }
          
          )
 }

  td.appendChild(input)
}

    else {
    // その他の型は従来どおり入力欄
    const input = document.createElement("input")
    input.className = "form-control form-control-sm"
    input.value = value ?? ""

    input.readOnly = readOnly
    input.dataset.columnName = column.name

    if (readOnly) {
      input.classList.add("bg-light")
      input.title = `${column.subtype} 型のため編集できません`
    } else {
      input.addEventListener("change", async (event) => {
        rowData[column.name] = this.parseValue(
          event.target.value,
          column
        );
        await this.edit_row(rowData);
      })
    }

    td.appendChild(input)
  }
      tr.appendChild(td)
    }

    if(!isSingle){
    const operationCell = document.createElement("td")
    operationCell.className = "d-flex justify-content-center gap-2"
    const addWrapper = document.createElement("div")
    addWrapper.className = "text-center"
    addWrapper.style.width = "100px"

    const deleteWrapper = document.createElement("div")
    deleteWrapper.className = "text-center"
    deleteWrapper.style.width = "60px"
    

    const deleteButton = document.createElement("button")

    deleteButton.type = "button"
    deleteButton.className = "btn btn-outline-danger btn-sm"
    deleteButton.textContent = "削除"

    deleteButton.addEventListener("click", async () => { if (confirm("本当に削除しますか？")) { await this.delete_row(rowData) } })

    const prevRow = rows[index - 1]
    const isBoundary =
    index == 0 ||
      (
        rowData.Order == null || rowData.Order !== prevRow.Order ||
        rowData.Priority == null || rowData.Priority !== prevRow.Priority
      )

    if (isBoundary && (index != 0 || rows.length == 1)) {
    const addButton = document.createElement("button")

    addButton.type = "button"
    addButton.className = "btn btn-outline-primary btn-sm"
    addButton.textContent = "行を上に追加"

    addButton.addEventListener("click", async () => { await this.add_row(index)})

    addWrapper.appendChild(addButton)
    }
    operationCell.appendChild(addWrapper)
    if(rows.length != 1){ deleteWrapper.appendChild(deleteButton) }
    
    operationCell.appendChild(deleteWrapper)

    tr.appendChild(operationCell)
    }
    this.tablebodyTarget.appendChild(tr)
    
  }
  
}
parseValue(value, column) {
  switch (column.type) {
    case "int": return value.trim() === "" ? null : Number(value)
    case "float": return value.trim() === "" ? null : Number(value)
    case "bool": return value === "true"
    default: return value
  }
}
async add_row(insertIndex) {
  const table = this.tables[this.currentTableName]
  const rows = table.dataList
  const upperRow = insertIndex > 0? rows[insertIndex - 1]?.[1]: null
  const new_priority = rows[insertIndex]["Priority"] == null ? null : (upperRow == null? rows[insertIndex]["Priority"]-1 : upperRow["Priority"])
  const new_order = rows[insertIndex]["Order"] == null ? null : (upperRow == null? rows[insertIndex]["Order"]-1 : upperRow["Order"])

  try {
    const res = await fetch("/thaqqa_api/prefab/data/new", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
      },
      body: JSON.stringify({
        bundleowner: this.bundleownerTarget.value,
        bundlename: this.bundlenameTarget.value,
        font_name: table.global == true ? null : this.fontTarget.value,
        datatable_name: this.currentTableName,
        priority: new_priority,
        order: new_order,
      })
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const json = await res.json()

    

    if (!json.ok) {
        throw new Error(`更新処理に失敗しました:${json.error}`)
    }
    this.parse_json(json,false)
    this.render(this.tables[this.currentTableName])
    } catch (error) {
    console.error(error)
  }


  
}

async edit_row(rowData) {
  const id = rowData.ID;
  const table = this.tables[this.currentTableName]

  try {
    const res = await fetch("/thaqqa_api/prefab/data/edit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
      },
      body: JSON.stringify({
        bundleowner: this.bundleownerTarget.value,
        bundlename: this.bundlenameTarget.value,
        font_name: table.global == true ? null : this.fontTarget.value,
        datatable_name: this.currentTableName,
        data_id: id,
        alter_data: rowData,
      })
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const json = await res.json()

    

    if (!json.ok) {
        throw new Error(`更新処理に失敗しました:${json.error}`)
    }
    this.parse_json(json,false)
    this.render(this.tables[this.currentTableName])
    } catch (error) {
    console.error(error)
  }

  this.render(table)
}


async delete_row(rowData) {
  const id = rowData.ID;
  const table = this.tables[this.currentTableName]

  try {
    const res = await fetch("/thaqqa_api/prefab/data/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
      },
      body: JSON.stringify({
        bundleowner: this.bundleownerTarget.value,
        bundlename: this.bundlenameTarget.value,
        font_name: table.global == true ? null : this.fontTarget.value,
        datatable_name: this.currentTableName,
        data_id: id,
      })
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const json = await res.json()

    

    if (!json.ok) {
        throw new Error(`更新処理に失敗しました:${json.error}`)
    }
    this.parse_json(json,false)
    this.render(this.tables[this.currentTableName])
    } catch (error) {
    console.error(error)
  }

}

}


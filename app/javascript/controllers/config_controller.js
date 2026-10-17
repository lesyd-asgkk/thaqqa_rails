import { Controller } from "@hotwired/stimulus"
const READ_ONLY_SUBTYPES = new Set(["id", "path", "regex"])

export default class extends Controller {
    static targets = ["bundleowner", "bundlename","font",  //bundle_owner,bundle_name,fontについては後々リスト表示できるようにする
    "tablehead","tablebody", "tableSelect",]
    
    connect() {     
        this.tables = {}
        this.currentTableName = null
        this.get_prefab() 
    }
    async add_content() {}
    async remove_content() {}

  async get_prefab() {
  const csrfToken = document.querySelector(
    'meta[name="csrf-token"]'
  )?.content

  try {
    const res = await fetch("/thaqqa_api/get_prefab", {
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
      console.error(json.error)
      return
    }

    // ここは実際の API レスポンスに合わせる
    const prefab = json.ok.prefab
    const staticTables = prefab.static_tables

    const fontTables = prefab.fonts[this.fontTarget.value].table_list

    const filteredStaticTables = Object.fromEntries(
        Object.entries(staticTables).filter(
         ([_, table]) => table.static == false && table.global == true 
        )
    )   // global属性、かつ非static属性のもののみを読み取る

    this.tables = {...structuredClone(filteredStaticTables),...structuredClone(fontTables),}

    this.tableSelectTarget.replaceChildren()

    for (const name of Object.keys(this.tables)) {
      const option = document.createElement("option")
      option.value = name
      option.textContent = name
      this.tableSelectTarget.appendChild(option)
    }

    const firstTable = Object.keys(this.tables)[0]

    if (firstTable) {
      this.currentTableName = firstTable
      this.tableSelectTarget.value = firstTable
      this.render(this.tables[firstTable])
    }
  } catch (error) {
    console.error("Prefabの取得に失敗しました:", error)
  }
}

  change_table(event) {
    this.currentTableName = event.target.value
    this.render(this.tables[this.currentTableName])
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
    input.addEventListener("change", (event) => { rowData[column.name] = event.target.value})
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
      input.addEventListener("change", (event) => {
        rowData[column.name] = event.target.checked
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
    input.addEventListener("input", 
        (event) => { const value = event.target.value 
            rowData[column.name] = value === "" ? null : Number(value) })
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
      input.addEventListener("input", (event) => {
        rowData[column.name] = this.parseValue(
          event.target.value,
          column
        )
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

    deleteButton.addEventListener("click", () => {
        if (confirm("本当に削除しますか？")) { this.delete_row(rowData.ID) }
      
    })

    const prevRow = rows[index - 1]
    const isBoundary =
      index == 0 ||
      (
        rowData.Order !== prevRow.Order ||
        rowData.Priority !== prevRow.Priority
      )

    if (isBoundary) {
    const addButton = document.createElement("button")

    addButton.type = "button"
    addButton.className = "btn btn-outline-primary btn-sm"
    addButton.textContent = "行を上に追加"

    addButton.addEventListener("click", () => { this.add_row(index)})

    addWrapper.appendChild(addButton)
    }
    operationCell.appendChild(addWrapper)
    deleteWrapper.appendChild(deleteButton)
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
add_row(insertIndex) {
  const table = this.tables[this.currentTableName]
  const columns = Object.values(table.columnList)

  // 現在の表示順で行を取得
  const rows = Object.entries(table.dataList)
    .sort(([, a], [, b]) => {
      return (a.Order ?? a.ID) - (b.Order ?? b.ID)
    })

  const nextId = rows.reduce(
    (max, [, row]) => Math.max(max, Number(row.ID) || 0),
    -1
  ) + 1

  const newRow = {}

  

  for (const column of columns) {
    switch (column.type) {
      case "int":
      case "float":
        newRow[column.name] = 0
        break

      case "bool":
        newRow[column.name] = false
        break

      default:
        newRow[column.name] = ""
    }
  }

if (order != null) { newRow.Order = order}
if (priority != null) { newRow.Priority = priority }


  // ID列を設定
  const idColumn = columns.find(
    column => column.subtype === "id"
  )
  if (idColumn) {
    newRow[idColumn.name] = nextId
  }

  // 直上の行があれば Order / Priority を複製
  const upperRow = insertIndex > 0
    ? rows[insertIndex - 1]?.[1]
    : null

  for (const column of columns) {
    if (
      column.name === "Order" ||
      column.name === "Priority"
    ) {
      if (upperRow && upperRow[column.name] != null) {
        newRow[column.name] = upperRow[column.name]
      }
    }
  }

  // dataList のキーは既存の最大値 + 1
  const nextKey = String(
    Math.max(-1, ...Object.keys(table.dataList).map(Number)) + 1
  )

  // 表示順の指定位置に挿入
  rows.splice(insertIndex, 0, [nextKey, newRow])

  // オブジェクトを再構築
  table.dataList = Object.fromEntries(rows)

  this.render(table)
}

delete_row(id) {
  const table = this.tables[this.currentTableName]

  const entry = Object.entries(table.dataList).find( ([, row]) => row.ID === id)

  if (!entry) return

  const [key] = entry
  delete table.dataList[key]

  this.render(table)
}

}


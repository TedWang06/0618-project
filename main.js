const _fileParent = "./data/ParentLayerGroups.json";
const _fileLayerGroup = "./data/LayerGroups.json";
const _fileLayers = "./data/Layers.json";

init();

function init() {

    const app = Vue.createApp({
        data() {
            return {
                menuData: [],
                groupData: [],
                originalLayerData: [],
                currentGroupId: 0,
            }
        },
        async mounted() {
            try { //promise.all
                this.menuData = await getParentData();
                this.groupData = await getLayerGroupsData();
                this.originalLayerData = await getLayersData();
            } catch {
                alert('data error');
            }
        },
        methods: {
            deleteData(value) {
                this.originalLayerData = deleteData.call(this,value);
            },
            addData(value) {
                this.originalLayerData = addData(this.originalLayerData, value);
            },
            editData(value) {
                this.originalLayerData = editData(this.originalLayerData, value);
            }

        }
    })

    app.component('LayerGroupList', {
        template: `
            <div class="leftWrap">
                <div v-for="(item, index) in menuData">
                    <button class="parentLayerButton" @click="clickOpen(index)">{{item.name}}</button>
                        <div class="LayerGroupsButton">
                            <button :id="'group'+item.id" v-for="(item, index) in getGroupData(item.id)" @click="getLayerGroup(item.id)">
                            {{item.name}}</button>
                        </div>
                </div>
            </div>
        `,
        props: {
            menuData: Array,
            groupData: Array,
            currentGroupId: Number
        },
        methods: {
            getGroupData: getGroupData,
            clickOpen: clickOpen,
            getLayerGroup: getLayerGroup
        },

    });



    app.component('layerData', {
        template: getLayerDataTemplate(),
        data() {
            return {
                isShow: 'nodata',
                checkedIds: [],
                checked: '',
                addLayerName: '',
                categorySelected: "基礎",
                editData: null
            }
        },
        components: {
            'addEditComponent': getAddEditComponent()
        },
        emits: ["edit", "add", "delete"],
        props: {
            currentGroupId: Number,
            originalLayerData: Array
        },
        methods: {
            changeAllChecked: changeAllChecked,
            deleteButton: deleteButton,
            addButton: addButton,
            editButton: editButton,
            submit: submit,
            unSubmit: unSubmit
        },
        computed: {
            displayData() {
                let id = this.currentGroupId;
                let data = this.originalLayerData.filter((item) => {
                    return item.groupId === id;
                })
                return data;
            },
            displayCheckboxArray() {
                return this.displayData.map(x => x.id);
            },
            isShowData() {
                return this.displayData.length > 0;
            },
            isAllCheckDisabled() {
                return this.displayData.length <= 0 ? true : false;
            },
            isDeleteDisabled() {
                return this.checkedIds.length > 0 ? false : true;
            }
        },
        watch: {
            'currentGroupId': currentGroupId,
            'checkedIds': checkedIds
        }
    });


    app.mount('.wrap')
}

function getGroupData(id) {
    return this.groupData.filter((item) => {
        return item.parentId === id;
    })
}

function clickOpen(index) {
    let panel = document.querySelectorAll('.parentLayerButton');

    // 切換+,-符號
    panel[index].classList.toggle("minus");

    // 是否顯示子層資料
    let panelChoosed = panel[index].nextElementSibling;
    if (panelChoosed.style.display === "block") {
        panelChoosed.style.display = "none";
    } else {
        panelChoosed.style.display = "block";
    }
}

function getLayerGroup(id) {

    this.$emit('update:modelValue', id);

    let buttons = document.querySelectorAll(".LayerGroupsButton button");
    buttons.forEach((item) => {
        item.classList.remove('buttonClick');
    })
    let str = '#group' + id;
    document.querySelector(str).classList.add('buttonClick');

}

function editButton(item) {
    this.isShow = 'add';
    const editDataCopy = item;

    // 深拷貝一個新物件
    let newObj = JSON.parse(JSON.stringify(editDataCopy));
    this.editData = newObj;

    this.addLayerName = this.editData.name;
    this.categorySelected = this.editData.category;
}

function submit(value) {
    if (this.editData) {
        const editValue = {
            id: this.editData.id,
            name: value.name,
            category: value.category
        };
        this.$emit('edit', editValue);
    } else {
        const addValue = {
            groupId: this.currentGroupId,
            name: value.name,
            category: value.category
        };
        this.$emit('add', addValue);
    }
    this.isShow = 'table';
}

function unSubmit(value) {
    this.isShow = value;
}

function getLayerDataTemplate() {
    return `
    <div v-if="isShow==='table'">
        <div class="rightWrapTop">
            <label for="allCheck">全選</label>
            <input type="checkbox" name="allCheck" id="allCheck" v-model="checked" @change="changeAllChecked()"
                :disabled='isAllCheckDisabled'>
            <button :disabled='isDeleteDisabled' @click="deleteButton">刪除圖層</button>
            <button @click="addButton">新增圖層</button>
        </div>
        <table v-if="isShowData">
            <thead>
                <tr>
                    <th></th>
                    <th>名稱</th>
                    <th>類別</th>
                    <th>建立時間</th>
                    <th>編輯</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(item, index) in displayData">
                    <td><input type="checkbox" v-model="checkedIds" :value="item.id"></td>
                    <td>{{item.name}}</td>
                    <td>{{item.category}}</td>
                    <td>{{item.createTimeString}}</td>
                    <td><button @click="editButton(item)">編輯</button></td>
                </tr>
            </tbody>
        </table>
        <p v-else>群組內無圖層</p>
    </div>

    <p v-else-if="isShow==='nodata'">請選擇圖層群組</p>

    <add-edit-component v-if="isShow==='add'" :addLayerName="addLayerName" :categorySelected ="categorySelected" 
                        @unSubmit="unSubmit" @submit="submit"></add-edit-component>`
}


function changeAllChecked() {
    if (this.checked) {
        this.checkedIds = this.displayCheckboxArray;
    } else {
        this.checkedIds = [];
    }
}

function deleteButton() {
    this.$emit('delete', this.checkedIds);
    this.checked = false;
    this.checkedIds = [];
}

function addButton() {
    this.editData = null;
    this.isShow = 'add';   
    this.addLayerName = '';
    this.categorySelected = '基礎';
}

function currentGroupId() {
    if (this.currentGroupId > 0) {
        this.isShow = 'table';
    } else {
        this.isShow = 'nodata';
    }
}

function checkedIds() {
    if (this.checkedIds.length == this.displayCheckboxArray.length) {
        this.checked = true;
    } else {
        this.checked = false;
    }
}

function getAddEditComponent() {

    return {
        template: `
            <div id="createLayer">
                <div>
                    <label for="createLayerName">圖層名稱</label>
                    <input type="text" name="createLayerName" id="createLayerName" v-model="addName">
                </div>
                <div>
                    <label for="createLayerCategory">圖層類別</label>
                    <select name="createLayerCategory" id="createLayerCategory" v-model="addCategory">
                        <option v-for="option in options" :value="option.value">
                            {{ option.text }}
                        </option>
                    </select>
                </div>
                <div>
                    <button @click="submit">確認</button>
                    <button @click="unSubmit">取消</button>
                </div>
            </div>
        `,
        data() {
            return {
                options: [
                    { value: "基礎", text: "基礎" },
                    { value: "警戒", text: "警戒" },
                    { value: "監測", text: "監測" }
                ],
                addName: '',
                addCategory: '基礎'
            }
        },
        emits: ["submit", "unSubmit"],
        props: {
            addLayerName: String,
            categorySelected: String
        },
        mounted() {
            this.addName = this.addLayerName;
            this.addCategory = this.categorySelected;
        },
        methods: {
            unSubmit() {
                this.$emit('unSubmit', 'table');
            },
            submit() {
                let value = {
                    name: this.addName,
                    category: this.addCategory
                };
                this.$emit('submit', value);
            }
        }

    }
}

function getParentData() {
    return new Promise((resolve, reject) => {
        let data = axios.get(_fileParent)
            .then(response => {
                resolve(response.data);
            })
            .catch(() => {
                alert('api error');
                reject();
            });
        return data;
    })

}

function getLayerGroupsData() {
    return new Promise((resolve, reject) => {
        let data = axios.get(_fileLayerGroup)
            .then(response => {
                resolve(response.data);
            })
            .catch(() => {
                alert('api error');
                reject();
            });
        return data;
    })
}

function getLayersData() {
    return new Promise((resolve, reject) => {
        let data = axios.get(_fileLayers)
            .then(response => {
                const data = response.data.map((item, index) => {
                    return {
                        ...item,
                        createTimeString: dayjs(item.createTime).format('YYYY-MM-DD HH:mm:ss')
                    }
                })
                resolve(data);
            })
            .catch(() => {
                alert('api error');
                reject();
            });
        return data;
    })
};

function addData(originalLayerData, addValue) {

    const originalLayerId = originalLayerData.map((item) => {
        return item.id;
    })
    let newDataId = Math.max(...originalLayerId);


    let addArray = {
        id: newDataId + 1,
        name: addValue.name,
        groupId: addValue.groupId,
        category: addValue.category,
        createTime: dayjs(),
        createTimeString: dayjs().format('YYYY-MM-DD HH:mm:ss')
    };
    originalLayerData.push(addArray);

    return originalLayerData;
}

function editData(originalLayerData, editValue) {

    let findItem = originalLayerData.find((item) => {
        return item.id === editValue.id;
        // if (item.id === editValue.id) {
        //     item.name = editValue.name;
        //     item.category = editValue.category;
        // };
    });

    findItem.name = editValue.name;
    findItem.category = editValue.category;

    return originalLayerData

}

function deleteData( checkedIds) {
    console.log(this);

    let data = this.originalLayerData.filter((item) => {
        return !checkedIds.includes(item.id);
    });
    return data;
}



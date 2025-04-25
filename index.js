const express = require('express');
const app = express();
const port = 3000;
const fs = require('fs')
const validator = require('validator');
const fileName = "data.json";
const encodeType = "utf-8";
const getLastId = arr => Array.isArray(arr) && arr.length > 0 ? arr.reduce((acc,cur) =>{
    const accId = acc.id || 0;
    const curId = cur.id || 0;

    return curId > accId ? cur : acc
}).id || 0: 0
const getNextId = arr => getLastId(arr) + 1;
const readFileData = (fName = fileName,eType = encodeType)=>{
    try{
        let data = fs.readFileSync(fName,eType);
        let messageValue =  data ? "data received successfuly." : "there is no data yet!";
        let statusValue = data ? "success" : "failed" 
        data = data || "[]";
        return {status:statusValue,message:messageValue,data:JSON.parse(data)}
    }catch(e){
        return {status:"failed",message:e}
    }
};
const writeFileData = (fName,newData) =>{
    try{
        fs.writeFileSync(fName,JSON.stringify(newData,null,4));
        return {status:"success",message:"data added successfuly."};
    }catch(e){
        return {status:"failed",message:e};
    }
};
function list(){
    let getData = readFileData();
    return getData;
}
const getToDoById = id =>{
    let getData = readFileData();
    
    if (getData.status == "success"){
        let found = getData.data.find(todo =>{
            return todo.id == id
        });
        return found ? {status:getData.status,message:getData.message,data:found} : {status:"failed",message:"there is no todo with this id."}
    }else{
        return {status:"failed",message:"failed to find data."}
    }
};
function addToDo(newTitle){
    let status = "failed";
    let message = "couldn't add this to-do.";
    if (!newTitle){
        message = "can't add todo with empty title."
        return {status,message}
    }
    let oldData = readFileData();
    let jsonData = oldData.status == 'success' ? oldData.data : [];
    let nextId = getNextId(jsonData);
    let newToDo = {id:nextId,title:newTitle,status:"new"}
    jsonData.push(newToDo);
    let addData = writeFileData(fileName,jsonData);
    return addData.status == "success" ? {status:addData.status,message:"row added successfuly.",data:newToDo} : addData;
}
function deleteToDo(id){
    let getData = readFileData();
    if (getData.status == "success"){
        let newData = getData.data.filter(todo=>{
            return todo.id != id;
        });
        let addData = writeFileData(fileName,newData);
        return addData.status == "success" ? {status:addData.status,message:"todo removed successfuly."} : addData;
    }else{
        return {status:"failed",message:"failed to find data."}
    }
}
function isValidStatus(testStatus){
    let validStatuses = ["new","inProgress","done"];
    return validStatuses.includes(testStatus);
}
function editToDo(id,params){
    let getData = readFileData();
    if (getData.status != "success"){
        return getData;
    }
    let status = params?.status
    let title = params?.title
    let found = getData.data.find(todo => {return todo.id == id});
    let totalUpdates = 0;
    if (!found){
        return {status:"failed",message:"couldn't find this todo id."}
    }
    if (status && isValidStatus(status)){
        found.status = status;
        totalUpdates++;
    }
    if (title){
        if (validator.isLength(title || '',{min:3,max:255})){
            found.title = title;
            totalUpdates++;
        }
    }
    if (totalUpdates > 0){
        let addData = writeFileData(fileName,getData.data);
        return addData.status == "success" ? {status:addData.status,message:"todo updated successfuly."} : addData;
    }else{
        return {status:"failed",message:"sorry , couldn't update the todo."}
    }

}
app.use(express.json());

app.get('/todos',(req,res,next)=>{
    res.status(200).send(list());
});
app.get('/todos/:id',(req,res,next)=>{
    let {id} = req.params;
    if(!validator.isInt(id)){
        return res.status(400).json({status:"failed",message:"the id must be int."});
    }
    let todo = getToDoById(id);
    return todo.status == "success" ? res.status(200).json(todo) : res.status(501).json(todo);
});
app.post('/todos',(req,res,next)=>{
    let newTitle = req.body?.title || "";
    if (!validator.isLength(newTitle || '',{min:3,max:255})){
        return res.status(400).json({status:"failed",message:"sorry , title is required with min 3 letters and max 255 letters."});
    }
    let insertToDo = addToDo(newTitle);
    return insertToDo.status == "success" ? res.status(201).json(insertToDo) : res.status(501).json(insertToDo)
});
app.delete('/todos/:id',(req,res,next) =>{
    let {id} = req.params;
    if(!validator.isInt(id)){
        return res.status(400).json({status:"failed",message:"the id must be int."});
    }
    let todo = getToDoById(id);
    if (todo.status == "success"){
        let del = deleteToDo(id);
        return del.status == 'success' ? res.sendStatus(204) : res.status(501).json(del);
    }else{
        return res.status(501).json(todo);
    }

});
app.patch('/todos/:id',(req,res,next)=>{
    let {id} = req.params;
    if(!validator.isInt(id)){
        return res.status(400).json({status:"failed",message:"the id must be int."});
    }
    let todo = getToDoById(id);
    if (todo.status == "success"){
        let update = editToDo(id,req?.body);
        return update.status == 'success' ? res.status(202).json(update) : res.status(501).json(update);
    }else{
        return res.status(501).json(todo);
    }
    
});
app.listen(port,()=>{
    console.log("ExpressJS server is Started.", `http://127.0.0.1:${port}`)
});
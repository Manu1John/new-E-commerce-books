const e = require("express")

document.getElementById("update-btn").addEventListener("click",editFunction)

function editFunction(){
    e.prevantDefault()
    const fullName = document.getElementById("fullName").value
    const phone = document.getElementById("phone").value
    const house = document.getElementById("house").value
    const area = document.getElementById("area").value
    const landmark =document.getElementById("landmark").value
    const city =document.getElementById("city").value
    const pincode =document.getElementById("pincode").value

    const fullNameError = document.getElementById("fullNameError").innerHTML = ""
    const phoneError = document.getElementById("phoneError").innerHTML = ""
    const houseError = document.getElementById("houseError").innerHTML = ""
    const areaError = document.getElementById("phoneError").innerHTML = ""
} 
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var multer = require('multer');
var cloudinary = require('cloudinary');
var method_override = require('method-override');
var app_password = 123;
var Schema = mongoose.Schema;

cloudinary.config({
	cloud_name: "dkpybtlyx",
	api_key: "184379841252625",
	api_secret: "wfW05ihhJJXkE3Pl6SCeXlY3r64"
});

var app = express();

// ya cree la db antes, se llamaba primer
mongoose.connect("mongodb://localhost/primer");

// para poder leer los post
app.use(bodyParser.json());
app.use(bodyParser.urlencoded( { extended: true }));

//guardar temporalmente en servidor para despues subir a cloudinary
app.use(multer({dest:__dirname+'/uploads/'}).any());

//sobre escribir methodos porque algunos navegadores no aceptan put
app.use(method_override("_method"));

//definir esquema de nuestros productos
var productSchemaJSON = 
{
	title:String,
	description:String,
	imageUrl:String,
	pricing:Number
};
// declarar variable por default en este caso la imagen
var productSchema = new Schema(productSchemaJSON);
productSchema.virtual("image.url").get(function(){
	if(this.imageUrl == "" || this.imageUrl == "data.png")
	{
		return "default.jpg";
	}
	return this.imageUrl;
});
var Product = mongoose.model("Product", productSchema);

app.set("view engine", "jade");
app.use(express.static("public"));

///////////// INICIO RUTAS  //////////////////

//***** GET **********
app.get("/", function(req,res)
{
	res.render("index");
});

app.get("/menu/:id/delete", function(solicitud, respuesta)
{
	var id = solicitud.params.id;

	Product.findOne({"_id": id}, function(err, product){
		respuesta.render("menu/delete",{ producto: product});
	});
	
});

app.delete("/menu/:id", function(solicitud, respuesta)
{
	if(solicitud.body.password == app_password)
	{
		Product.remove({"_id": solicitud.params.id}, function(error){
			if(error){ console.log(error); }
			respuesta.redirect("/menu");
		})
	}
	else{
		respuesta.redirect("/");
	}
});

app.get("/admin", function(solicitud, respuesta){
	respuesta.render("admin/form");
});

app.get("/menu", function(solicitud, respuesta)
{
	Product.find(function(error,documento){
		if(error){ console.log(error); }
		respuesta.render("menu/index", { products: documento });
	});
});

app.get("/menu/new", function(solicitud, respuesta)
{
	respuesta.render("menu/new");
});

app.get("/menu/edit/:id", function(solicitud, respuesta)
{
	var id_producto = solicitud.params.id;
	//query
	Product.findOne({"_id": id_producto},function(error, producto){
		respuesta.render("menu/edit", {product: producto});
	});
	
});

//***** POST **********
app.post("/menu", function(solicitud, respuesta)
{
	if(solicitud.body.password == app_password)
	{
		var data = {
			title: solicitud.body.title,
			description: solicitud.body.Descripcion,
			//imageUrl: "data.png",
			pricing: solicitud.body.Pricing
		}

		var prod = new Product(data);
		console.log(solicitud.files.length);
		if(solicitud.files.length > 0)
		{
			//subir imagen a cloudinary y si subio bien se guarda en mongodb
			cloudinary.uploader.upload(solicitud.files[0].path, function(result) 
			{ 
				prod.imageUrl = result.url;
				prod.save(function(err)
				{
					//console.log(prod);
					//respuesta.render("./menu");
					Product.find(function(error,documento){
						if(error){ console.log(error); }
						respuesta.render("menu/index", { products: documento });
					});


				});
			});
		}
		else
		{
			prod.save(function(err)
			{
				//console.log(prod);
				//respuesta.render("./menu");

				Product.find(function(error,documento){
						if(error){ console.log(error); }
						respuesta.render("menu/index", { products: documento });
					});

			});
		}

	}
	else
	{
		respuesta.render("menu/new");
	}
});

app.post("/admin", function(solicitud, respuesta)
{
	if(solicitud.body.password == app_password)
	{
		Product.find(function(error,documento){
		if(error){ console.log(error); }
		respuesta.render("admin/index", { products: documento });
	});
	}
	else
	{
		respuesta.redirect("/");
	}
});

//***** PUT **********
app.put("/menu/:id", function(solicitud, respuesta)
{
	if(solicitud.body.password == app_password)
	{
		var data = {
			title: solicitud.body.title,
			description: solicitud.body.Descripcion,
			pricing: solicitud.body.Pricing
		};

		if(solicitud.files.length > 0)
		{
			//subir imagen a cloudinary y si subio bien se guarda en mongodb
			cloudinary.uploader.upload(solicitud.files[0].path, function(result) 
			{ 
				data.imageUrl = result.url;
				Product.update({"_id": solicitud.params.id}, data, function(){
				respuesta.redirect("/menu");
				});
			});
		}
		else{
			Product.update({"_id": solicitud.params.id}, data, function(){
				respuesta.redirect("/menu");
			});
		}
	}
	else{
		respuesta.redirect("/");
	}
});

///////////// FIN RUTAS  //////////////////

app.listen(8080);
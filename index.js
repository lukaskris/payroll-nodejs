var express = require("express");
var mysql   = require("mysql");
var bodyParser  = require("body-parser");
var md5 = require('MD5');
var multer = require('multer');
var upload = multer();
var app  = express();
var upload  = multer({ storage: multer.memoryStorage() });

function REST(){
    var self = this;
    self.connectMysql();
};

REST.prototype.connectMysql = function() {
    var self = this;
    var pool      =    mysql.createPool({
        connectionLimit : 100,
        host: '35.194.155.250',
        user: 'root',
        password: 'lukask10tki',
        database : 'payroll',
        debug    :  false
    });
    pool.getConnection(function(err,connection){
        if(err) {
          self.stop(err);
        } else {
          self.configureExpress(connection);
        }
    });
}

REST.prototype.configureExpress = function(connection) {
      var self = this;
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use(bodyParser.json());
      var router = express.Router();
      app.use('/api', router);
      self.handleRoutes(router,connection,md5);
      self.startServer();
}

REST.prototype.handleRoutes= function(router,connection,md5) {
    router.get("/",function(req,res){
        res.json({"Message" : "Hello World !"});
    });

   /*	USER	*/
    router.post("/employee",function(req,res){
		var queryfind = "SELECT * FROM customer where email = '"+req.body.email+"' ORDER BY email LIMIT 1";
		connection.query(queryfind, function(error,result){
			if(error){
				res.status(error.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + error});
			}
			if(result.length>0){
				res.json(result[0]);
			}else{
				var query = "INSERT INTO ??(??,??,??,??,??) VALUES (?,?,?,?,?)";
				var table = ["customer","name","email","phone","password","picture",req.body.name, req.body.email,req.body.phone,md5(req.body.password),req.body.picture];
				query = mysql.format(query,table);
				connection.query(query,function(err,rows){
					if(err) {
						res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
					} else {
						connection.query(queryfind,function(e,r){
							if(!err){
								res.json(r[0]);
							}
						});

					}
				});
			}

		});


    });

    router.get("/employee",function(req,res){
        var query = "SELECT * FROM ??";
        var table = ["karyawan"];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json(rows);
            }
        });
    });

    router.get("/employee/:id",function(req,res){
        var query = "SELECT * FROM ?? WHERE nik=?";
        var table = ["karyawan",req.params.id,req.params.id];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json(rows[0]);
            }
        });
    });

    router.put("/employee",function(req,res){
        var query = "UPDATE ?? SET ?? = ? WHERE ?? = ?";
        var table = ["karyawan","password",md5(req.body.password),"email",req.body.email];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json({"Error" : false, "Message" : "Updated the password for email "+req.body.email});
            }
        });
    });

    router.put("/token",function(req,res){
        var query = "UPDATE ?? SET ??=? WHERE ?? = ?";

        var table = ["customer","firebasetoken",req.body.firebasetoken,"email",req.body.email];

        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json({"Error" : false, "Message" : "Updated profile"});
            }
        });
    });

    router.put("/profile",function(req,res){
        var query = "UPDATE ?? SET ??=?, ??=?, ??=?, ??=?, ??=? WHERE ?? = ?";

        var table = ["customer","name",req.body.name,"phone",req.body.phone,"datebirth",new Date(req.body.datebirth),"gender",req.body.gender,"firebasetoken",req.body.firebasetoken,"email",req.body.email];

        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json({"Error" : false, "Message" : "Updated profile"});
            }
        });
    });

    router.delete("/customer/:email",function(req,res){
        var query = "DELETE from ?? WHERE ??=?";
        var table = ["customer","email",req.params.email];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json({"Error" : false, "Message" : "Deleted the user with email "+req.params.email});
            }
        });
    });

    router.get("/category",function(req,res){
        var query = "SELECT * FROM ??";
        var table = ["category"];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json(rows);
            }
        });
    });

    router.get("/items",function(req,res){
        var query = "SELECT * FROM ??";
        var table = ["item_view"];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json(rows);
            }
        });
    });

    router.get("/item/:category/:offset/:limit",function(req,res){
        var query = "SELECT * FROM ?? WHERE category_id = ? ORDER BY created_at desc LIMIT ? OFFSET ? ";
        var table = ["item", parseInt(req.params.category), parseInt(req.params.limit), parseInt(req.params.offset)];

        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json(rows);
            }
        });
    });

    router.get("/item/:category/:offset/:limit/:filter/:order",function(req,res){
        var query = "SELECT * FROM ?? WHERE category_id = ? ORDER BY "+ req.params.order +" LIMIT ? OFFSET ? ";
        if(req.params.filter != "*"){
            query = "SELECT * FROM ?? WHERE category_id = ? and "+ req.params.filter +" ORDER BY "+ req.params.order +" LIMIT ? OFFSET ? ";
        }

        var table = ["item", parseInt(req.params.category), parseInt(req.params.limit), parseInt(req.params.offset)];

        query = mysql.format(query,table);

        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json(rows);
            }
        });
    });


	router.get("/search_item/:key/:offset/:limit/:filter/:order",function(req,res){
        var query = "SELECT * FROM ?? WHERE ?? like ? ORDER BY "+ req.params.order +" LIMIT ? OFFSET ? ";

        if(req.params.filter != "*"){
            query = "SELECT * FROM ?? WHERE ?? like ? and "+ req.params.filter +" ORDER BY "+ req.params.order +" LIMIT ? OFFSET ? ";
        }
        var table = ["item", "name", "%"+req.params.key+"%" , parseInt(req.params.limit), parseInt(req.params.offset)];

        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json(rows);
            }
        });
    });

    router.get("/sub_item/:id",function(req,res){
        var query = "SELECT * FROM ?? WHERE ??=?";
        var table = ["sub_item", "item_id", req.params.id];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json(rows);
            }
        });
    });

    router.post("/shipping_address",function(req,res){
        var query = "INSERT INTO ??(??,??,??,??,??,??,??,??,??,??,??,??) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)";
        var table = ["shippingaddress","name","address","province","province_id","city","city_id","subdistrict","subdistrict_id","postal_code","phone","status","email",
                     req.body.name, req.body.address, req.body.province, req.body.province_id, req.body.city, req.body.city_id, req.body.subdistrict, req.body.subdistrict_id, req.body.postal_code, req.body.phone, req.body.status, req.body.email];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json({"Error" : false, "Message" : "Shipping Address Added!"});
            }
        });
    });

    router.post("/addkaryawan", upload.single('fingerprint'), function(req,res){
        var query="INSERT INTO ??(??,??,??,??,??,??) values(?,?,?,?,?,?)";
        console.log(req.file);
        var table = ["karyawan", "nik", "nama", "bagian_id", "gajiharian", "gajitotal","fingerprint", req.body.nik, req.body.nama, req.body.bagian_id, req.body.gajiharian, req.body.gajitotal, req.file.buffer];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json({"Error" : false, "Message" : "Karyawan Added!"});
            }
        });
    });

	router.delete("/shipping_address/:id",function(req,res){
		var query = "DELETE FROM ?? WHERE ??=?";
		var table = ["shippingaddress","id",req.params.id];
		query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json({"Error" : false, "Message" : "Shipping Address Deleted!"});
            }
        });
	});

    router.put("/shipping_address/:id",function(req,res){
        var query = "UPDATE ?? SET status='1' WHERE ??=? and ??=?";
        var table = ["shippingaddress","id",req.params.id, "email", req.body.email];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json({"Error" : false, "Message" : "Shipping Address Updated!"});
            }
        });
    });

    router.get("/shipping_address/:id",function(req,res){
        var query = "SELECT * FROM ?? WHERE ??=? order by status desc";
        var table = ["shippingaddress", "email", req.params.id];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json(rows);
            }
        });
    });

    router.get("/shipping_address/:email/:id",function(req,res){
        var query = "SELECT * FROM ?? WHERE ??=? and ??=? order by status desc";
        var table = ["shippingaddress", "email", req.params.email, "id", req.params.id];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json(rows[0]);
            }
        });
    });

    router.get("/default_shipping_address/:id",function(req,res){
        var query = "SELECT * FROM ?? WHERE ??=? AND STATUS=1";
        var table = ["shippingaddress", "email", req.params.id];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json(rows);
            }
        });
    });


    router.post("/orders",function(req,res){
        var query = "INSERT INTO ??(??,??,??) VALUES (?,?,?)";
        var table = ["orders","total","email","status", req.body.total,req.body.email, req.body.status];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {

                query = "SELECT *,DATE_ADD(created_at,INTERVAL 8 HOUR) as expired_at FROM ?? WHERE ??=?";
                table = ["orders", "id", rows.insertId];
                query = mysql.format(query,table);
                connection.query(query,function(e,r){
                    if(!err){
                        var regisToken = "";
                        query ="select * from customer where ?? = ?";
                        table = ["email", req.body.email];
                        query = mysql.format(query, table);
                        connection.query(query, function(error, rows){

                            var payload = {
                              notification: {
                                    title: "Menunggu Pembayaran",
                                    body: "Transaksi berhasil, silahkan melakukan pembayaran dan upload bukti pembayaran anda."
                              },
                              data: {
                                    intent:"detailtransaksitagihan",
                                    invoice:r[0].invoice
                              }
                            };
                            regisToken = rows[0].firebasetoken;
                            admin.messaging().sendToDevice(regisToken, payload).then(function(response){
                                console.log("successfully sent message: ", response);
                            })
                            .catch(function(error1){
                                console.log("Error sending message:", error1);
                            })
                        });
                        res.json(r[0]);
                    }
                });
            }
        });
    });

	router.put("/orders",function(req,res){
        var query = "UPDATE ?? SET ?? = ? WHERE ??=?";
        var table = ["orders","status",req.body.status, "invoice", req.body.invoice];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json({"Error" : false, "Message" : "Orders Updated!"});
            }
        });
    });

    router.get("/orders/:email/:offset/:limit",function(req,res){
        var query = "SELECT * FROM ?? WHERE ??=? ORDER BY created_at desc LIMIT ? OFFSET ?";
        var table = ["orders_view", "email", req.params.email, parseInt(req.params.limit), parseInt(req.params.offset)];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json(rows);
            }
        });
    });


    router.get("/orders/:email/:offset/:limit/:filter/:search",function(req,res){
        var query = "SELECT * FROM ?? WHERE ??=? and (status<2 or status=5) and (?? like ? or ?? like ?) and status like ?  ORDER BY created_at desc LIMIT ? OFFSET ?";
		var filter = "";
		var search = "";
		if(req.params.filter != "*"){
			filter = req.params.filter;
		}
		if(req.params.search != "*"){
			search = req.params.search;
		}
        var table = ["orders_view", "email", req.params.email, "name", "%"+search+"%", "invoice", "%"+search+"%", "%"+ filter + "%", parseInt(req.params.limit), parseInt(req.params.offset)];
        //console.log("WITH FILTER"+table);
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                console.log(err);
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                console.log(rows);
                res.json(rows);
            }
        });
    });


    router.get("/orders_pembelian/:email/:offset/:limit/:filter/:search",function(req,res){
        var query = "SELECT * FROM ?? WHERE ??=? and status>0 and status<5 and (?? like ? or ?? like ?) and status like ?  ORDER BY created_at desc LIMIT ? OFFSET ?";
		var filter = "";
		var search = "";
		if(req.params.filter != "*"){
			filter = req.params.filter;
		}
		if(req.params.search != "*"){
			search = req.params.search;
		}
        var table = ["orders_view", "email", req.params.email, "name", "%"+search+"%", "invoice", "%"+search+"%", "%"+ filter + "%", parseInt(req.params.limit), parseInt(req.params.offset)];

        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json(rows);
            }
        });
    });

    router.get("/orders_detail/:invoice",function(req,res){
        var query = "SELECT * FROM ?? WHERE ??=?";
        var table = ["orders_detail_view", "invoice", req.params.invoice];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                console.log("error order detail", err);
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                console.log(rows);
                res.json(rows);
            }
        });
    });

    router.post("/orders_detail",function(req,res){
        var query = "INSERT INTO ??(??,??,??,??,??,??) VALUES (?,?,?,?,?,?)";
        var table = ["orders_detail","invoice","item_id","sub_item_id","subtotal","price","quantity",
                    req.body.invoice, req.body.item_id, req.body.sub_item_id, req.body.subtotal, req.body.price,req.body.quantity];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json({"Error" : false, "Message" : "User Added !"});
            }
        });
    });

    router.post("/orders_info",function(req,res){
        var query = "INSERT INTO ??(??,??,??,??,??) VALUES (?,?,?,?,?)";
        var table = ["orders_info","invoice","kurir","type","price","shipping_id",
                    req.body.invoice, req.body.kurir, req.body.type, req.body.price, req.body.shipping_id];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json({"Error" : false, "Message" : "User Added !"});
            }
        });
    });

    router.get("/orders_info/:invoice", function(req,res){
        var query = "SELECT * FROM ?? WHERE ??=?";
        var table = ["orders_info", "invoice", req.params.invoice];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json(rows);
            }
        });
    });

	router.post("/orders_bukti", function(req,res){
        var query = "INSERT INTO ??(??,??) VALUES(?,?)";
        var table = ["orders_bukti", "invoice","url", req.body.invoice, req.body.url];

        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json({"Error" : false, "Message" : "Bukti Saved !"});
            }
        });
    });

	router.get("/search/:key", function(req,res){
        var query = "SELECT * FROM ?? WHERE ?? like ? limit 5";
        var table = ["item", "name", "%"+req.params.key+"%"];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json(rows);
            }
        });
    });

    router.get("transaction_success/:invoice", function(req,res){
        var regisToken = "";
        var query ="select * from customer where ?? = ?";
        var table = ["email", req.body.email];
        query = mysql.format(query, table);
        connection.query(query, function(error, rows){

            var payload = {
              notification: {
                    title: "Pembayaran Sukses",
                    body: "Bukti pembayaran diterima."
              },
              data: {
                    intent:"detailtransaksipembelian",
                    invoice: req.params.invoice
              }
            };
            regisToken = rows[0].firebasetoken;
            admin.messaging().sendToDevice(regisToken, payload).then(function(response){
                console.log("successfully sent message: ", response);
            })
            .catch(function(error1){
                console.log("Error sending message:", error1);
            })
        });
    });
}


REST.prototype.startServer = function() {
	app.listen(process.env.PORT || 3000, function(){
	  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
	});
}

REST.prototype.stop = function(err) {
    console.log("ISSUE WITH MYSQL n" + err);
    process.exit(1);
}


new REST();

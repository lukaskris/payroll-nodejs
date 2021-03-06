var express = require("express");
var mysql   = require("mysql");
var bodyParser  = require("body-parser");
var md5 = require('MD5');
var multer = require('multer');
var upload = multer();
var dateFormat = require('dateformat');
var app  = express();
var upload  = multer({ storage: multer.memoryStorage() });
app.use(bodyParser.json({limit:'50mb'}));
app.use(bodyParser.urlencoded({extended:true, limit: '50mb'}));


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


    //====******************************===//
    //             Employee                //

    router.get("/employee/:filter/:limit/:offset/:order",function(req,res){
        var query = "SELECT nik, nama as name, bagian_id as position, gajiharian as salaryPerDay, gajitotal as salary, pinjamperiodelalu as debtpreviousperiode, saldo as balance, tanggal_masuk as `join`, tanggal_keluar as `out` FROM ?? ORDER BY "+ req.params.order;
        if(req.params.filter != "*"){
            query = "SELECT nik, nama as name, bagian_id as position, gajiharian as salaryPerDay, gajitotal as salary, pinjamperiodelalu as debtpreviousperiode, saldo as balance, tanggal_masuk as `join`, tanggal_keluar as `out` FROM ?? WHERE  tanggal_keluar is null and "+ req.params.filter +" ORDER BY "+ req.params.order;
        }
        if(req.params.limit != "0"){
            query += " LIMIT " + req.params.limit;
            if(req.params.offset != "0"){
                query +=" OFFSET " + req.params.offset;
            }
        }
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

    router.get("/potongan_karyawan", function(req,res){
       var query = "SELECT nik, nama as name, bagian_id as position, gajiharian as salaryPerDay, gajitotal as salary, pinjamperiodelalu as debtpreviousperiode, saldo as balance, tanggal_masuk as `join`, tanggal_keluar as `out`, upah, pemotongan1, pemotongan2 from ??";
       var table = ["potongan_karyawan"];
       query = mysql.format(query,table);
       console.log(query);
       connection.query(query, function(err,rows){
          if(err){
            res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
          }else{
            res.json(rows);
          }
       });
    });

    router.get("/employee/:id",function(req,res){
        var query = "SELECT nik, nama as name, bagian_id as position, gajiharian as salaryPerDay, gajitotal as salary, pinjamperiodelalu as debtpreviousperiode, saldo as balance, tanggal_masuk as `join`, tanggal_keluar as `out` FROM ?? WHERE nik=?";
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

    router.post("/employee/exit", function(req, res){
        var query = "UPDATE ?? SET ?? =  STR_TO_DATE(?, '%d-%m-%Y'), aktif = 0 WHERE ?? = ?";
        var date = new Date(req.body.out);
        var table = ["karyawan", "tanggal_keluar", dateFormat(date, "dd-mm-yyyy"), "nik", req.body.nik];
        query = mysql.format(query, table);
        connection.query(query, function(err, rows){
            if(err){
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            }else{
                res.json({"Error" : false, "Message" : "Updated employee for nik "+req.body.nik});
            }
        });
    });

    router.put("/employee",function(req,res){
        var query = "UPDATE ?? SET ?? = ?, ?? = ?, ?? =?, ??=? WHERE ?? = ?";
        var table = ["karyawan","nama", req.body.name, "bagian_id", req.body.position ,"gajiharian", req.body.salaryPerDay ,"gajitotal", req.body.salary, "nik", req.body.nik];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json({"Error" : false, "Message" : "Updated employee for nik "+req.body.nik});
            }
        });
    });

    router.get("/history_potongan/:filter", function(req,res){
        var query = "SELECT * FROM ?? where " + req.params.filter;
        // var query = "SELECT karyawan_id as nik, potongan as cut, hutang as debt, periode FROM ?? where " + req.params.filter;
        var table = ["history_potongan"];
        query = mysql.format(query, table);
        connection.query(query, function(err, rows){
           if(err){
              res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
           }else {
              res.json(rows);
           }
        });
    });

    router.get("/history_pinjaman/:filter", function(req,res){
        var query = "SELECT karyawan_id as nik, pinjaman, sudah_umk, periode FROM ?? where "+ req.params.filter;
        var table = ["history_pinjaman"];
        query = mysql.format(query, table);
        connection.query(query, function(err, rows){
           if(err){
              res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
           }else {
              res.json(rows);
           }
        });
    });

    router.post("/employee", function(req,res){
        var query="INSERT INTO ??(??,??,??,??,??, ??, ??,tanggal_masuk) values(?,?,?,?,?,?,?,now())";
        console.log(req.body);
        var table = ["karyawan", "nik", "nama", "bagian_id", "gajiharian", "gajitotal", "saldo","saldoawal", req.body.nik, req.body.name, req.body.position, req.body.salaryPerDay, req.body.salary, req.body.balance, req.body.balance];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json({"Error" : false, "Message" : "Karyawan Added!"});
            }
        });
    });

    router.put("/employee/:id", function(req, res){
      var query="UPDATE ?? SET ?? = ? WHERE ?? = ?";
      var table = ["karyawan", "aktif", 0, "nik", req.params.id];
      query = mysql.format(query,table);
      console.log(query);
      connection.query(query,function(err,rows){
          if(err) {
              res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
          } else {
              res.json({"Error" : false, "Message" : "Karyawan Updated!"});
          }
      });
    });

    router.post("/uploadfinger/:id", upload.single('fingerprint'), function(req,res){
        var query = "UPDATE karyawan SET fingerprint = ? where nik = ?";
        var buffer = null;
        if(req.file){
          buffer = req.file.buffer;
        }

        var table = [buffer, req.params.id];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                console.log(err);
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json({"Error" : false, "Message" : "Karyawan Added!"});
            }
        });
    });

    router.delete("/employee/:id",function(req,res){
        var query = "DELETE from ?? WHERE ??=?";
        var table = ["karyawan","nik",req.params.id];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json({"Error" : false, "Message" : "Deleted the karyawan with id "+req.params.id});
            }
        });
    });
    router.get("/version",function(req,res){
        var query = "select * from version";
        connection.query(query, function(err, rows){
          if(err) {
              res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
          } else {
              res.json(rows[0]);
          }
        });
    });


    //====******************************===//
    //             Position                //

    router.get("/position/:filter",function(req,res){
        var query = "SELECT * FROM ??";
        if(req.params.filter != "*"){
          query = query + " where " +  req.params.filter;
        }
        var table = ["bagian"];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json(rows);
            }
        });
    });

    router.delete("/position/:id",function(req,res){
        var query = "DELETE from ?? WHERE ??=?";
        var table = ["position","bagian_id",req.params.id];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json({"Error" : false, "Message" : "Deleted the position with id "+req.params.id});
            }
        });
    });

    //====******************************===//
    //         Report New Employee         //
    router.get("/reportnewemployee",function(req,res){
        var query = "SELECT * FROM ??";
        var table = ["view_karyawan_baru"];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json(rows);
            }
        });
    });


    //====******************************===//
    //         Report Exit Employee         //
    router.get("/reportexitemployee",function(req,res){
        var query = "SELECT * FROM ??";
        var table = ["view_karyawan_keluar"];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json(rows);
            }
        });
    });



    //====******************************===//
    //         Report New Employee         //
    router.get("/reportemployeeumk",function(req,res){
        var query = "SELECT * FROM ??";
        var table = ["view_karyawan_mencapai_umk"];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json(rows);
            }
        });
    });



    //====******************************===//
    //         Report Employee Pinjam         //
    router.get("/reportpinjamkoperasi",function(req,res){
        var query = "SELECT * FROM ??";
        var table = ["view_karyawan_pinjam_koperasi"];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json(rows);
            }
        });
    });



    //====******************************===//
    //         Report kenaikan gaji         //
    router.get("/reportkenaikangaji",function(req,res){
        var query = "SELECT * FROM ??";
        var table = ["view_kenaikan_gaji"];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json(rows);
            }
        });
    });

    //====******************************===//
    //            Report Hutang            //
    router.get("/reporthutang",function(req,res){
        var query = "SELECT * FROM ??";
        var table = ["report_hutang"];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json(rows);
            }
        });
    });

    //====******************************===//
    //       Report Pinjaman Karyawan      //
    router.get("/reportpinjamankaryawan",function(req,res){
        var query = "SELECT * FROM ??";
        var table = ["report_pinjaman_karyawan"];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json(rows);
            }
        });
    });

    router.get("/version",function(req,res){
        var query = "SELECT * FROM ??";
        var table = ["version"];
        query = mysql.format(query,table);
        connection.query(query,function(err,rows){
            if(err) {
                res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
            } else {
                res.json(rows[0]);
            }
        });
    });


    router.get("/periode", function(req, res){
       var query = "SELECT * FROM ?? order by id desc limit 1";
       var table = ["periode"];
       query = mysql.format(query,table);
       connection.query(query,function(err,rows){
           if(err) {
               res.status(err.status || 500).json({"Error" : true, "Message" : "Error executing MySQL query " + err});
           } else {
               res.json(rows[0]);
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

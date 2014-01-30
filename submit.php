<?php
    if(!(isset($_POST['getgoing']) && $_POST['getgoing'] == 'more_like_peanut_BETTER')){
        header('HTTP/1.1 400 Bad Request');
        exit();
    }

    try{
        require('JACKED/jacked_conf.php');
        $JACKED = new JACKED(array('Syrup'));

        sleep(3);
        $name = $_POST['name'];
        $email = $_POST['email'];
        $postalCode = $_POST['postalCode'];
        $guid = $JACKED->Util->uuid4();

        $inforeq = $JACKED->Syrup->InfoRequest->create();
        $inforeq->guid = $guid;
        $inforeq->name = $name;
        $inforeq->email = $email;
        $inforeq->postal_code = $postalCode;

        $inforeq->save();
        
    }catch(Exception $e){
        header('HTTP/1.1 500 Internal Server Error');
        error_log($e->getMessage());
        exit();
    }

?>
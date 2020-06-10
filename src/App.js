import React,{useState, useEffect} from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';

let api,wsProvider;
wsProvider = new WsProvider('wss://kusama-rpc.polkadot.io/')

async function initialize(){
  api = await ApiPromise.create({ provider: wsProvider })
  const mingle = await api.isReady;
  console.log('mingle => ', mingle);
};

async function balanceAndNounce(){
  api = await ApiPromise.create({ provider: wsProvider });

  const ADDR = 'Gt6HqWBhdu4Sy1u8ASTbS1qf2Ac5gwdegwr8tWN8saMxPt5';
  const now = await api.query.timestamp.now();
  // // Retrieve the account balance & nonce via the system module
  const { nonce, data: balance } = await api.query.system.account(ADDR);
  return (`${now}: balance of ${balance.free} and a nonce of ${nonce}`);
}

async function getGenesisHash() {  
  api = await ApiPromise.create({ provider: wsProvider });
  return await api.genesisHash.toHex().toString();
  // console.log(api);
  // // The actual address that we will use
  // const ADDR = 'Gt6HqWBhdu4Sy1u8ASTbS1qf2Ac5gwdegwr8tWN8saMxPt5';
  
  // // Retrieve the last timestamp
  // const now = await api.query.timestamp.now();
  
  // // Retrieve the account balance & nonce via the system module
  // const { nonce, data: balance } = await api.query.system.account(ADDR);
  // console.log(`${now}: balance of ${balance.free} and a nonce of ${nonce}`);
  
  // // console.log(new BN(await api.query.timestamp.now()).toString())
  // console.log(await api.query.system.account(ADDR))
  
  // // Retrieve the chain name
  // const chain = await api.rpc.system.chain();
  
  // // Retrieve the latest header
  // const lastHeader = await api.rpc.chain.getHeader();
  
  // let count = 0;
  
  // // Subscribe to the new headers
  // const unsubHeads = await api.rpc.chain.subscribeNewHeads((lastHeader) => {
  //   console.log(`${chain}: last block #${lastHeader.number} has hash ${lastHeader.hash}`);
  
  //   if (++count === 10) {
  //     unsubHeads();
  //   }
  // });
}

async function getChainName() {
  api = await ApiPromise.create({ provider: wsProvider });
  return await api.rpc.system.chain();
}



function App() {

  const [name,setName] = useState('No Chain');
  const [validators,setValidators] = useState('0');
  const [validatorsList,setValidatorsList] = useState([]);
  const [validatorsListComission,setValidatorsListComission] = useState([]);
  const [blocks,setBlocks] = useState([]); 

  async function tenBlocks(){
    await ApiPromise.create({ provider: wsProvider });
    // Subscribe to the new headers
    await api.rpc.chain.subscribeNewHeads((lastHeader) => {
    let oldState = JSON.parse(JSON.stringify(blocks));
    console.log('Blocks => ',blocks);
    oldState.push(`last block #${lastHeader.number}  ${lastHeader.hash}`) 
    setBlocks(oldState)
    });
  }

  async function validatorsCount(){
    api = await ApiPromise.create({ provider: wsProvider });
    await api.query.staking.validatorCount( (val) => {
      setValidators (val['words'][0]);
      console.log('Count ',val['words'][0]);
    });
  }

  async function getCommission(arr){
    // let oldState = validatorsListComission;
    // for(let i=0; i < arr.length; i++){
      const prefs = await api.query.staking.validators(arr);
      console.log(JSON.parse(JSON.stringify(prefs['commission'].toHuman())));
      // return (JSON.parse(JSON.stringify(prefs['commission'].toHuman())))
      // oldState.push(JSON.stringify(prefs['commission'].toString()));
    // }
    // setValidatorsListComission(oldState);
  }

  async function allValidator(){
    api = await ApiPromise.create({ provider: wsProvider });
    await api.query.session.validators((abc) => {
      let oldState = validatorsList;
      // let oldState2 = validatorsListComission;
      for(let i=0; i< abc.length; i++){
        oldState.push(abc[i].toString());
        // getCommission(abc[i].toString());
        // oldState2.push(getCommission(abc[i].toString()));
        
      }
      setValidatorsList(oldState);
      // setValidatorsListComission(oldState2);

    });
  
  }
  
  useEffect(() => {

    getChainName().then(function(val) { 
      setName(val); 
    });
    
    validatorsCount();

    allValidator();

    tenBlocks();

  },[])
  return (
    <div className="container">
      <div className="row mt-3">

        <div className="col-md-3 text-center">
          <div className="card">
            <div className="card-body">
              <p>Chain Name</p>
              <p className="display-4 text-warning">{name}</p>
            </div>
          </div>
        </div>

        <div className="col-md-3 text-center">
          <div className="card">
            <div className="card-body">
                <p>Validators Count</p>
                <p className="display-4 text-warning">{validators}</p>
            </div>
          </div>
        </div>

        <div className="col-md-6">
        <div className="card">
          <div className="card-body">
            <p>Latest Information</p>
            <p>
              {
                // latestBlock.map(lb => <li>{lb}</li>)
                blocks.map(block => <p>{block}</p>)
              }
            </p>
            <p>
              
            </p>
          </div>
        </div>
        </div>
      </div> 
      <div className="mt-3">
          <div className="card">
            <div className="card-body">
              <table className="table table-striped table-bordered">
                <thead>
                  <tr>
                    <td>Validator</td>
                    <td>Some1</td>
                    <td>Commission</td>
                  </tr>
                </thead>
                <tbody>
                      {
                        validatorsList.map(validators =>
                          <tr>
                            <td>{validators}</td>
                            <td></td>
                            <td>{validatorsListComission}</td>
                          </tr>)
                      }
                </tbody>
              </table>
            </div>
          </div>
      </div>
    </div>
  );
}

export default App;

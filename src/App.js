import React,{useState, useEffect} from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';

let api,wsProvider;
wsProvider = new WsProvider('wss://kusama-rpc.polkadot.io/')

async function getChainName() {
  api = await ApiPromise.create({ provider: wsProvider });
  return await api.rpc.system.chain();
}

function App() {

  const blockModelList = [];

  const [data,setData] = useState([]);
  const [name,setName] = useState('No Chain');
  const [validators,setValidators] = useState('0');
  const [blocks,setBlocks] = useState([]); 

  async function tenBlocks(){
    await ApiPromise.create({ provider: wsProvider });
    // Subscribe to the new headers
    await api.rpc.chain.subscribeNewHeads((lastHeader) => {
    let oldState = JSON.parse(JSON.stringify(blocks));
    // console.log('Blocks => ',blocks);
    oldState.push(`last block #${lastHeader.number}  ${lastHeader.hash}`) 
    setBlocks(oldState)
    });
  }
  async function validatorsCount(){
    api = await ApiPromise.create({ provider: wsProvider });
    await api.query.staking.validatorCount( (val) => {
      setValidators (val['words'][0]);
      // console.log('Count ',val['words'][0]);
    });
  }

  async function getCommission(arr){
      const prefs = await api.query.staking.validators(arr);
      // console.log(JSON.parse(JSON.stringify(prefs['commission'].toHuman())));
      return await JSON.parse(JSON.stringify(prefs['commission'].toHuman()))
  }

  async function getStake(arr){
      const info = await api.query.system.account(arr);
      // console.log(JSON.parse(JSON.stringify(prefs['commission'].toHuman())));
      return await JSON.parse(JSON.stringify(info['data'].feeFrozen.toHuman()))
  }
  async function getOtherStake(arr){
    let others = [];
    const era = await api.query.staking.currentEra();
    const acc = await api.query.staking.erasStakers(era.toString(),arr);
    let count = acc['others'].length;

    for(let i=0; i < count; i++) {
      let who1 = {};
      who1.account = JSON.parse(JSON.stringify(acc['others'][i].who.toHuman()));
      who1.value = JSON.parse(JSON.stringify(acc['others'][i].value.toHuman()));
      others.push(who1);
    }
    return others;
    // return await JSON.parse(JSON.stringify(info['data'].feeFrozen.toHuman()))
  }


  async function events() {
    const api = await ApiPromise.create({ provider: wsProvider });
    // Subscribe to system events via storage
    api.query.system.events((events) => {
      console.log(`\nReceived ${events.length} events:`);
  
      // Loop through the Vec<EventRecord>
      events.forEach((record) => {
        // Extract the phase, event and the event types
        const { event, phase } = record;
        const types = event.typeDef;
  
        // Show what we are busy with
        if(event.section == 'staking' || event.section == 'imOnline' || event.section == 'offences'){
          console.log(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
          console.log(`\t\t${event.meta.documentation.toString()}`);
          // Loop through each of the parameters, displaying the type and data
          event.data.forEach((data, index) => {
            console.log(`\t\t\t${types[index].type}: ${data.toString()}`);
          });
        }      
      });
    });
  }

  async function allValidator(){
    api = await ApiPromise.create({ provider: wsProvider });
    await api.query.session.validators( (abc) => {

      for(let i=0; i< abc.length; i++){

        let blockModel = {};
        blockModel.validator=abc[i].toString()
        getCommission(abc[i].toString()).then((com) => {
          blockModel.commission=com;
        }); 
        getStake(abc[i].toString()).then((com)=>{
          blockModel.stake=com;
        });
        getOtherStake(abc[i].toString()).then((com)=>{
          blockModel.others=JSON.parse(JSON.stringify(com));
          // console.log(typeof(com))
        });
        blockModelList.push(blockModel);

      }
      // console.log(blockModelList)
      setData(blockModelList);

    });
  
  }
  
  useEffect(() => {

    getChainName().then(function(val) { 
      setName(val); 
    });
    
    validatorsCount();

    allValidator();

    tenBlocks();

    events();

  },[])
  return (
    <div className="container-fluid">
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
                    <td>Own Stake</td>
                    <td>Other Stake</td>
                    <td>Commission</td>
                  </tr>
                </thead>
                <tbody>
                      {
                        data.map(obj => 
                          <tr key={obj.validator}>
                            <td>{obj.validator}</td>
                            <td>{obj.stake}</td>
                            <td className="f1">
                              {Array.isArray(obj.others)  && obj.others.map(obj2 => 
                              <li key={obj.value}>{obj2.account} => {obj2.value}</li>
                              )}
                            </td>
                            <td>{obj.commission}</td>
                          </tr>
                        )
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

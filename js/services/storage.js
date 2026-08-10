
const KEY="footballhub-cache-v1";
export const storage={
  get(key,fallback=null){try{return JSON.parse(localStorage.getItem(KEY+"-"+key)) ?? fallback}catch{return fallback}},
  set(key,value){localStorage.setItem(KEY+"-"+key,JSON.stringify(value))}
};

type CapabilityUrlManagerItem<Type> = {
    createdAt: number,
    item: Type
};

export class CapabilityUrlsManager<Type>{
    map: Map<string, CapabilityUrlManagerItem<Type>>
    expiresIn: number;

    constructor(){
        this.map = new Map<string, CapabilityUrlManagerItem<Type>>;
        this.expiresIn = 5 * 60 * 1000; // 5 minutes
    }

    set(url: string, item:Type){
        this.map.set(url, {createdAt: Date.now(), item})
    }

    get(url: string){
        if(!this.map.has(url)){
            return null;
        }
        const {createdAt, item} = this.map.get(url);
        if(createdAt + this.expiresIn < Date.now()){
            this.map.delete(url);
            return null;
        }
        return item;
    }
}

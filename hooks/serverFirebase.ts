import { ref, update, get, push, remove } from "firebase/database";
import { database } from "@/firebaseConfig";

export async function useUpdate(Ref: string, object: object) {
    try {
        await update(ref(database, Ref), object);
    } catch (error) {
        console.error('Erro ao atualizar o banco de dados', error);
    }
}

export async function useGet(Ref: string) {
    try {
        const data = await get(ref(database, Ref));
        if (data.exists()) {
            console.log(data.val());
            return (data.val())
        }
    } catch (error) {
        console.error('Erro ao buscar os dados', error);
    }
}

export async function usePush(Ref: string, object: object) {
    try {
        const data = await push(ref(database, Ref), object);
        return data.key;

    } catch (error) {
        console.error('Erro inserir no banco de dados', error);
    }
}

export async function useRemove(Ref: string) {
    try {
        await remove(ref(database, Ref));
    } catch (error) {
        console.error('Erro ao buscar os dados', error);
    }
}
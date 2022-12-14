import { createContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  UserProps,
  IUser,
  IUserLogin,
  ICreateTransaction,
  IAccount,
  ITransactions,
} from "../interfaces";
import api from "../services/api";
import jwt_decode from "jwt-decode";

export interface UserProviderData {
  handleRegister: (data: IUser) => void;
  handleLogin: (data: IUserLogin) => void;
  handlePostTransaction: (data: ICreateTransaction) => void;
  handleGetAccountById: () => void;
  handleGetTransactions: (type?: string) => void;
  transaction: ITransactions[];
  account: IAccount;
  logout: () => void;
  setTransaction: React.Dispatch<React.SetStateAction<ITransactions[]>>;
}

export const UserContext = createContext<UserProviderData>(
  {} as UserProviderData
);

export const UserProvider = ({ children }: UserProps) => {
  const [login, setLogin] = useState<IUserLogin>();
  const [account, setAccount] = useState<IAccount>({} as IAccount);
  const [transaction, setTransaction] = useState<ITransactions[]>([]);

  const accountCreated = () =>
    toast.success("Conta criada com sucesso!", { autoClose: 1000 });

  const accountError = () =>
    toast.error("Ops! Usuário já cadastrado", {
      autoClose: 1000,
      position: "top-left",
    });

  const passwordOrUsernameError = () =>
    toast.error("Senha ou usuário incorreto!", { autoClose: 1000 });

  const transactionCreated = () =>
    toast.success("Transação feita com sucesso!", { autoClose: 1000 });
  const transactionError = () =>
    toast.error("Transação mal sucedida!", { autoClose: 1000 });

  const navigate = useNavigate();

  const handleRegister = async (data: IUser) => {
    await api
      .post("users", data)
      .then((response) => {
        if (response.status === 201) {
          accountCreated();
          return navigate("/");
        }
      })
      .catch((err) => accountError());
  };

  const handleLogin = (data: IUserLogin) => {
    api
      .post("/login", data)
      .then((response) => {
        if (response.status === 200) {
          const token: string = response.data.token;
          const userId: any = jwt_decode(token);
          setLogin(response.data.user);
          window.localStorage.setItem("@token", token);
          window.localStorage.setItem("@userId", userId.sub);
          navigate(`/dashboard`);
        }
      })
      .catch((err) => passwordOrUsernameError());
  };

  const handlePostTransaction = (data: ICreateTransaction) => {
    const token = localStorage.getItem("@token");

    api
      .post("/transactions", data, {
        headers: { Authorization: `Bearer ${token}` },
      })

      .then((response) => {
        transactionCreated();
        handleGetTransactions();
        handleGetAccountById();
      })
      .catch((err) => transactionError());
  };

  const handleGetAccountById = () => {
    const token = localStorage.getItem("@token");

    api
      .get(`/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setAccount(response.data);
      })

      .catch((err) => console.warn(err));
  };

  const handleGetTransactions = (type?: string) => {
    const token = localStorage.getItem("@token");
    api
      .get(`/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { type },
      })
      .then((response) => {
        setTransaction(response.data);
        console.log(response.data);
      })

      .catch((err) => console.warn(err));
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <UserContext.Provider
      value={{
        handleRegister,
        handleLogin,
        handlePostTransaction,
        handleGetAccountById,
        handleGetTransactions,
        transaction,
        account,
        logout,
        setTransaction,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

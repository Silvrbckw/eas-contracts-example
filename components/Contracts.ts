import { ContractFactory, Signer } from 'ethers';
import { ethers } from 'hardhat';
import { Attester__factory, EAS__factory, SchemaRegistry__factory, UintResolver__factory } from '../typechain-types';

export * from '../typechain-types';

type AsyncReturnType<T extends (...args: any) => any> = T extends (...args: any) => Promise<infer U>
  ? U
  : T extends (...args: any) => infer U
  ? U
  : any;

type Contract<F extends ContractFactory> = AsyncReturnType<F['deploy']>;

export interface ContractBuilder<F extends ContractFactory> {
  metadata: {
    contractName: string;
    bytecode: string;
  };
  deploy(...args: Parameters<F['deploy']>): Promise<Contract<F>>;
  attach(address: string, passedSigner?: Signer): Promise<Contract<F>>;
}

export type FactoryConstructor<F extends ContractFactory> = {
  new (signer?: Signer): F;
  abi: unknown;
  bytecode: string;
};

export const deployOrAttach = <F extends ContractFactory>(
  contractName: string,
  FactoryConstructor: FactoryConstructor<F>,
  initialSigner?: Signer
): ContractBuilder<F> => {
  return {
    metadata: {
      contractName,
      bytecode: FactoryConstructor.bytecode
    },
    deploy: async (...args: Parameters<F['deploy']>): Promise<Contract<F>> => {
      const defaultSigner = initialSigner ?? ((await ethers.getSigners())[0] as any as Signer);

      return new FactoryConstructor(defaultSigner).deploy(...(args || [])) as Promise<Contract<F>>;
    },
    attach: attachOnly<F>(FactoryConstructor, initialSigner).attach
  };
};

export const attachOnly = <F extends ContractFactory>(
  FactoryConstructor: FactoryConstructor<F>,
  initialSigner?: Signer
) => {
  return {
    attach: async (address: string, signer?: Signer): Promise<Contract<F>> => {
      const defaultSigner = initialSigner ?? ((await ethers.getSigners())[0] as any as Signer);
      return new FactoryConstructor(signer ?? defaultSigner).attach(address) as Contract<F>;
    }
  };
};

/* eslint-disable camelcase */
const getContracts = (signer?: Signer) => ({
  connect: (signer: Signer) => getContracts(signer),

  EAS: deployOrAttach('EAS', EAS__factory, signer),
  Attester: deployOrAttach('Attester', Attester__factory, signer),
  UintResolver: deployOrAttach('UintResolver', UintResolver__factory, signer),
  SchemaRegistry: deployOrAttach('SchemaRegistry', SchemaRegistry__factory, signer)
});
/* eslint-enable camelcase */

export default getContracts();
